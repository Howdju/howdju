const Promise = require('bluebird')
const moment = require('moment')

const cloneDeep = require('lodash/cloneDeep')
const concat = require('lodash/concat')
const every = require('lodash/every')
const filter = require('lodash/filter')
const get = require('lodash/get')
const isFinite = require('lodash/isFinite')
const join = require('lodash/join')
const map = require('lodash/map')
const partition = require('lodash/partition')
const toNumber = require('lodash/toNumber')

const {
  JustificationBasisTypes,
  SortDirections,
  isTruthy,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  CANNOT_MODIFY_OTHER_USERS_ENTITIES,
  ActionType,
  ActionTargetTypes,
  newImpossibleError,
  idEqual,
  requireArgs,
  newExhaustedEnumError,
} = require('howdju-common')

const {justificationSchema} = require('./validationSchemas')
const {
  EntityService
} = require('./EntityService')
const {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  permissions,
} = require('../permissions')
const {
  RequestValidationError,
  EntityTooOldToModifyError,
  UserActionsConflictError,
  EntityConflictError,
  EntityValidationError,
  AuthorizationError,
} = require('../serviceErrors')
const {
  rethrowTranslatedErrors
} = require('../util')


exports.JustificationsService = class JustificationsService extends EntityService {

  constructor(
    config,
    logger,
    actionsService,
    authService,
    propositionsService,
    statementsService,
    writQuotesService,
    propositionCompoundsService,
    justificationBasisCompoundsService,
    justificationsDao,
    permissionsDao
  ) {
    super(justificationSchema, logger, authService)
    requireArgs({
      config,
      logger,
      actionsService,
      authService,
      propositionsService,
      statementsService,
      writQuotesService,
      propositionCompoundsService,
      justificationBasisCompoundsService,
      justificationsDao,
      permissionsDao
    })
    this.config = config
    this.logger = logger
    this.actionsService = actionsService
    this.authService = authService
    this.propositionsService = propositionsService
    this.statementsService = statementsService
    this.writQuotesService = writQuotesService
    this.propositionCompoundsService = propositionCompoundsService
    this.justificationBasisCompoundsService = justificationBasisCompoundsService
    this.justificationsDao = justificationsDao
    this.permissionsDao = permissionsDao
  }

  readJustificationForId(justificationId, {userId}) {
    return this.justificationsDao.readJustificationForId(justificationId)
      .then( (justification) => {
        return Promise.all([
          justification,
          readRootTarget(this, justification, userId),
          readJustificationTarget(this, justification.target, {userId}),
          readJustificationBasis(this, justification.basis, {userId}),
        ])
      })
      .then( ([
        justification,
        rootTarget,
        targetEntity,
        basisEntity
      ]) => {
        justification.rootTarget = rootTarget

        justification.target.entity = targetEntity
        logTargetInconsistency(this, justification)

        justification.basis.entity = basisEntity

        return justification
      })
  }

  async readJustifications({
    filters,
    sorts,
    continuationToken,
    count = 25,
    includeUrls = false,
  }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }
    if (filters && filter(filters).length > 1) {
      throw new RequestValidationError("Only one filter is supported because justifications have one basis.")
    }

    if (!continuationToken) {
      return this.readInitialJustifications(filters, sorts, countNumber, includeUrls)
    }
    return this.readMoreJustifications(continuationToken, countNumber, includeUrls)
  }

  async readInitialJustifications(filters, requestedSorts, count, includeUrls) {
    const disambiguationSorts = [{property: 'id', direction: SortDirections.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    const justifications = await this.justificationsDao.readJustifications(filters, unambiguousSorts, count, false, includeUrls)
    const continuationToken = createContinuationToken(unambiguousSorts, justifications, filters)
    return {
      justifications,
      continuationToken,
    }
  }

  readMoreJustifications(continuationToken, count, includeUrls) {
    const {
      sorts,
      filters,
    } = decodeContinuationToken(continuationToken)
    return this.justificationsDao.readJustifications(filters, sorts, count, true, includeUrls)
      .then(justifications => validateJustifications(this.logger, justifications))
      .then(justifications => {
        const nextContinuationToken = createNextContinuationToken(sorts, justifications, filters) || continuationToken
        return {
          justifications,
          continuationToken: nextContinuationToken
        }
      })
  }

  readJustificationsWithBasesAndVotesByRootTarget(rootTargetType, rootTargetId, {userId}) {
    return this.justificationsDao.readJustificationsWithBasesAndVotesByRootTarget(rootTargetType, rootTargetId, {userId})
  }

  async doReadOrCreate(justification, userId, now) {
    if (justification.id) {
      return {
        isExtant: true,
        justification: await this.readJustificationForId(justification.id, {userId})
      }
    }

    return await readOrCreateEquivalentValidJustificationAsUser(this, justification, userId, now)
  }

  deleteJustification(authToken, justificationId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => Promise.all([
        userId,
        this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
        this.justificationsDao.readJustificationForId(justificationId),
      ]))
      .then(([userId, hasPermission, justification]) => {
        const now = new Date()
        const result = [userId, now, justification]

        if (hasPermission) {
          return result
        }

        const creatorUserId = get(justification, 'creator.id')
        if (!creatorUserId || userId !== creatorUserId) {
          throw new AuthorizationError({modelErrors: [CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
        }

        const created = moment(justification.created)
        const graceCutoff = created.clone()
        graceCutoff.add(this.config.modifyEntityGracePeriod)
        const nowMoment = moment(now)
        if (nowMoment.isAfter(graceCutoff)) {
          throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod)
        }

        return result
      })
      .then(([userId, now, justification]) => Promise.all([
        userId,
        now,
        justification,
        deleteCounterJustificationsToJustificationIds(this.justificationsDao, [justification.id], userId, now),
      ]))
      .then(([userId, now, justification, deletedCounterJustificationIds]) => Promise.all([
        userId,
        now,
        this.justificationsDao.deleteJustification(justification, now),
        map(deletedCounterJustificationIds, id => this.actionsService.asyncRecordAction(userId, now, ActionType.DELETE, ActionTargetTypes.JUSTIFICATION, id)),
      ]))
      .then(([userId, now, deletedJustificationId]) => Promise.all([
        deletedJustificationId,
        this.actionsService.asyncRecordAction(userId, now, ActionType.DELETE, ActionTargetTypes.JUSTIFICATION, deletedJustificationId),
      ]))
      .then(([deletedJustificationId]) => ({
        deletedJustificationId,
      }))
  }
}

function logTargetInconsistency(service, justification) {
  if (
    justification.target.type !== JustificationTargetTypes.JUSTIFICATION &&
    !(
      idEqual(justification.rootTarget.id, justification.target.entity.id)
      || justification.rootTargetType !== justification.target.type
    )
  ) {
    this.logger.error(`Justification ${justification.id} targets ${justification.target.type}` +
      ` ${justification.target.entity.id} but has inconsistent root target ${justification.rootTargetType} ${justification.rootTarget.id}`)
  }
}

function readRootTarget(service, justification, userId) {
  switch (justification.rootTargetType) {
    case JustificationRootTargetTypes.PROPOSITION:
      return service.propositionsService.readPropositionForId(justification.rootTarget.id, {userId})
    case JustificationRootTargetTypes.STATEMENT:
      return service.statementsService.readStatementForId(justification.rootTarget.id, {userId})
    default:
      throw newImpossibleError(`Exhausted JustificationRootTargetTypess: ${justification.rootTargetType}`)
  }
}


function readJustificationTarget(service, justificationTarget, {userId}) {
  switch (justificationTarget.type) {

    case JustificationTargetTypes.PROPOSITION:
      return service.propositionsService.readPropositionForId(justificationTarget.entity.id, {userId})

    case JustificationTargetTypes.STATEMENT:
      return service.statementsService.readStatementForId(justificationTarget.entity.id, {userId})

    case JustificationTargetTypes.JUSTIFICATION:
      return service.readJustificationForId(justificationTarget.entity.id, {userId})

    default:
      throw newExhaustedEnumError('JustificationTargetTypes', justificationTarget.type)
  }
}

function readJustificationBasis(service, justificationBasis, {userId}) {
  switch (justificationBasis.type) {

    case JustificationBasisTypes.WRIT_QUOTE:
      return service.writQuotesService.readWritQuoteForId(justificationBasis.entity.id, {userId})

    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      return service.propositionCompoundsService.readPropositionCompoundForId(justificationBasis.entity.id, {userId})

    case JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND:
      return service.justificationBasisCompoundsService.readJustificationBasisCompoundForId(justificationBasis.entity.id, {userId})

    default:
      throw newExhaustedEnumError('JustificationBasisTypes', justificationBasis.type)
  }
}

function readOrCreateEquivalentValidJustificationAsUser(service, justification, userId, now) {
  return Promise.all([
    readOrCreateJustificationTarget(service, justification.target, userId, now)
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.target')),
    readOrCreateJustificationBasis(service, justification.basis, userId, now)
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.basis')),
    now,
  ])
    .then( ([
      {targetEntity},
      {basisEntity},
      now,
    ]) => {
      justification = cloneDeep(justification)

      justification.target.entity = targetEntity
      justification.basis.entity = basisEntity

      switch (justification.target.type) {
        case JustificationTargetTypes.PROPOSITION:
        case JustificationTargetTypes.STATEMENT:
          justification.rootTarget = justification.target.entity
          justification.rootTargetType = justification.target.type
          break
        case JustificationTargetTypes.JUSTIFICATION:
          justification.rootTarget = justification.target.entity.rootTarget
          justification.rootTargetType = justification.target.entity.rootTargetType
          break
        default:
          throw newExhaustedEnumError('JustificationTargetTypes', justification.target.type)
      }

      return [now, justification]
    })
    .then( ([now, justification]) => Promise.all([
      now,
      justification,
      service.justificationsDao.readJustificationEquivalentTo(justification)
    ]))
    .then( ([now, justification, equivalentJustification]) => Promise.all([
      now,
      justification,
      !!equivalentJustification,
      equivalentJustification || service.justificationsDao.createJustification(justification, userId, now)
    ]))
    .then( ([now, justification, isExtant, dbJustification]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetTypes.JUSTIFICATION, dbJustification.id)
      return [justification, isExtant, dbJustification]
    })
    .then( ([inJustification, isExtant, dbJustification]) => {
      const justification = cloneDeep(dbJustification)
      justification.target.entity = inJustification.target.entity
      justification.basis.entity = inJustification.basis.entity
      return {
        isExtant,
        justification,
      }
    })
}

function readOrCreateJustificationTarget(service, justificationTarget, userId, now) {
  switch (justificationTarget.type) {

    case JustificationTargetTypes.PROPOSITION:
      return service.propositionsService.readOrCreateValidPropositionAsUser(justificationTarget.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then(({isExtant, proposition}) => ({
          isExtant,
          targetType: justificationTarget.type,
          targetEntity: proposition,
        }))

    case JustificationTargetTypes.STATEMENT:
      return Promise.resolve(service.statementsService.doReadOrCreate(justificationTarget.entity, userId, now))
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then(({isExtant, statement}) => ({
          isExtant,
          targetType: justificationTarget.type,
          targetEntity: statement,
        }))

    case JustificationTargetTypes.JUSTIFICATION:
      return Promise.resolve(service.doReadOrCreate(justificationTarget.entity, userId, now))
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, justification}) => ({
          isExtant,
          targetType: justificationTarget.type,
          targetEntity: justification,
        }))

    default:
      throw newExhaustedEnumError('JustificationTargetTypes', justificationTarget.type)
  }
}

function readOrCreateJustificationBasis(service, justificationBasis, userId, now) {
  switch (justificationBasis.type) {

    case JustificationBasisTypes.WRIT_QUOTE:
      return service.writQuotesService.readOrCreateWritQuoteAsUser(justificationBasis.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, writQuote}) => ({
          isExtant,
          basisEntity: writQuote,
        }))

    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      // Proposition compounds were per-justification, so we always created.  Not sure this actually makes sense now, but this is a legacy type anyways
      return service.propositionCompoundsService.createPropositionCompoundAsUser(justificationBasis.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, propositionCompound}) => ({
          isExtant,
          basisEntity: propositionCompound,
        }))

    case JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND:
      return service.justificationBasisCompoundsService.readOrCreateJustificationBasisCompoundAsUser(justificationBasis.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, justificationBasisCompound}) => ({
          isExtant,
          basisType: JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
          basisEntity: justificationBasisCompound,
        }))

    default:
      throw newImpossibleError(`Unsupported JustificationBasisTypes: ${justificationBasis.type}`)
  }
}

function validateJustifications(logger, justifications) {
  const [goodJustifications, badJustifications] = partition(justifications, j =>
    j.basis.type !== JustificationBasisTypes.PROPOSITION_COMPOUND ||
    j.basis.entity.atoms &&
    j.basis.entity.atoms.length > 0 &&
    every(j.basis.entity.atoms, a => isTruthy(a.entity.id))
  )
  if (badJustifications.length > 0) {
    logger.error(`these justifications have invalid proposition compounds: ${join(map(badJustifications, j => j.id), ', ')}`)
    logger.error(badJustifications)
  }
  return goodJustifications
}

function deleteCounterJustificationsToJustificationIds (
  justificationsDao,
  justificationIds,
  userId,
  now,
  deletedJustificationIds = []
) {
  return Promise.resolve()
    .then(() => {
      if (justificationIds.length === 0) {
        return deletedJustificationIds
      }
      // TODO(1,2,3): remove exception
      // eslint-disable-next-line promise/no-nesting
      return justificationsDao.deleteCounterJustificationsToJustificationIds(justificationIds, now)
        .then(currentlyDeletedJustificationIds =>
          deleteCounterJustificationsToJustificationIds(justificationsDao, currentlyDeletedJustificationIds, userId, now,
            deletedJustificationIds.concat(currentlyDeletedJustificationIds))
        )
    })
}
