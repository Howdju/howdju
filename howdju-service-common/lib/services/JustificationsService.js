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
  JustificationBasisType,
  SortDirection,
  isTruthy,
  JustificationTargetType,
  CANNOT_MODIFY_OTHER_USERS_ENTITIES,
  ActionType,
  ActionTargetType,
  newImpossibleError,
  idEqual,
  requireArgs,
  newExhaustedEnumError,
} = require('howdju-common')

const {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  RequestValidationError,
  EntityTooOldToModifyError,
  UserActionsConflictError,
  EntityConflictError,
  EntityValidationError,
  AuthorizationError,
} = require('../serviceErrors')
const {
  permissions,
} = require('../permissions')
const {
  rethrowTranslatedErrors
} = require('../util')


exports.JustificationsService = class JustificationsService {

  constructor(
    config,
    logger,
    justificationValidator,
    actionsService,
    authService,
    statementsService,
    writQuotesService,
    statementCompoundsService,
    justificationBasisCompoundsService,
    justificationsDao,
    permissionsDao
  ) {
    requireArgs({
      config,
      logger,
      justificationValidator,
      actionsService,
      authService,
      statementsService,
      writQuotesService,
      statementCompoundsService,
      justificationBasisCompoundsService,
      justificationsDao,
      permissionsDao
    })
    this.config = config
    this.logger = logger
    this.justificationValidator = justificationValidator
    this.actionsService = actionsService
    this.authService = authService
    this.statementsService = statementsService
    this.writQuotesService = writQuotesService
    this.statementCompoundsService = statementCompoundsService
    this.justificationBasisCompoundsService = justificationBasisCompoundsService
    this.justificationsDao = justificationsDao
    this.permissionsDao = permissionsDao
  }

  readJustificationForId(justificationId, {userId}) {
    return this.justificationsDao.readJustificationForId(justificationId)
      .then( (justification) => {
        return Promise.all([
          justification,
          this.statementsService.readStatementForId(justification.rootStatement.id, {userId}),
          readJustificationTarget(this, justification.target, {userId}),
          readJustificationBasis(this, justification.basis, {userId}),
        ])
      })
      .then( ([
        justification,
        rootStatement,
        targetEntity,
        basisEntity
      ]) => {
        justification.rootStatement = rootStatement

        justification.target.entity = targetEntity
        if (
          justification.target.type === JustificationTargetType.STATEMENT &&
          !idEqual(justification.rootStatement.id, justification.target.entity.id)
        ) {
          this.logger.error(`Justification ${justification.id} targets statement ${justification.target.entity.id} but has inconsistent root statement ${justification.rootStatement.id}`)
        }

        justification.basis.entity = basisEntity

        return justification
      })
  }

  readJustifications({
    filters,
    sorts,
    continuationToken,
    count = 25,
  }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }
    if (filters && filter(filters).length > 1) {
      throw new RequestValidationError("Only one filter is supported because justifications have one basis.")
    }

    if (!continuationToken) {
      return this.readInitialJustifications(filters, sorts, countNumber)
    }
    return this.readMoreJustifications(continuationToken, countNumber)
  }

  readInitialJustifications(filters, requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.justificationsDao.readJustifications(filters, unambiguousSorts, count)
      .then(justifications => {
        const continuationToken = createContinuationToken(unambiguousSorts, justifications, filters)
        return {
          justifications,
          continuationToken,
        }
      })
  }

  readMoreJustifications(continuationToken, count) {
    const {
      sorts,
      filters,
    } = decodeContinuationToken(continuationToken)
    return this.justificationsDao.readJustifications(filters, sorts, count, true)
      .then(justifications => validateJustifications(this.logger, justifications))
      .then(justifications => {
        const nextContinuationToken = createNextContinuationToken(sorts, justifications, filters) || continuationToken
        return {
          justifications,
          continuationToken: nextContinuationToken
        }
      })
  }

  readJustificationsWithBasesAndVotesByRootStatementId(rootStatementId, {userId}) {
    return this.justificationsDao.readJustificationsWithBasesAndVotesByRootStatementId(rootStatementId, {userId})
  }

  readOrCreateJustification(justification, authToken) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        return this.readOrCreateJustificationAsUser(justification, userId, new Date())
      })
  }

  readOrCreateJustificationAsUser(justification, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.justificationValidator.validate(justification)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return [userId, now]
      })
      .then( ([userId, now]) => this.readOrCreateValidJustificationAsUser(justification, userId, now))
  }

  readOrCreateValidJustificationAsUser(justification, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (justification.id) {
          return Promise.props({
            isExtant: true,
            justification: this.readJustificationForId(justification.id, {userId})
          })
        }

        return readOrCreateEquivalentValidJustificationAsUser(this, justification, userId, now)
      })
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
        const graceCutoff = created.add.apply(created, this.config.modifyEntityGracePeriod)
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
        map(deletedCounterJustificationIds, id => this.actionsService.asyncRecordAction(userId, now, ActionType.DELETE, ActionTargetType.JUSTIFICATION, id)),
      ]))
      .then(([userId, now, deletedJustificationId]) => Promise.all([
        deletedJustificationId,
        this.actionsService.asyncRecordAction(userId, now, ActionType.DELETE, ActionTargetType.JUSTIFICATION, deletedJustificationId),
      ]))
      .then(([deletedJustificationId]) => ({
        deletedJustificationId,
      }))
  }
}

function readJustificationTarget(service, justificationTarget, {userId}) {
  switch (justificationTarget.type) {

    case JustificationTargetType.JUSTIFICATION:
      return service.readJustificationForId(justificationTarget.entity.id, {userId})

    case JustificationTargetType.STATEMENT:
      return service.statementsService.readStatementForId(justificationTarget.entity.id, {userId})

    default:
      throw newExhaustedEnumError('JustificationTargetType', justificationTarget.type)
  }
}

function readJustificationBasis(service, justificationBasis, {userId}) {
  switch (justificationBasis.type) {

    case JustificationBasisType.WRIT_QUOTE:
      return service.writQuotesService.readWritQuoteForId(justificationBasis.entity.id, {userId})

    case JustificationBasisType.STATEMENT_COMPOUND:
      return service.statementCompoundsService.readStatementCompoundForId(justificationBasis.entity.id, {userId})

    case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
      return service.justificationBasisCompoundsService.readJustificationBasisCompoundForId(justificationBasis.entity.id, {userId})

    default:
      throw newExhaustedEnumError('JustificationBasisType', justificationBasis.type)
  }
}

function readOrCreateEquivalentValidJustificationAsUser(server, justification, userId, now) {
  return Promise.all([
    readOrCreateJustificationTarget(server, justification.target, userId, now)
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.target')),
    readOrCreateJustificationBasis(server, justification.basis, userId, now)
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
        case JustificationTargetType.STATEMENT:
          justification.rootStatement = justification.target.entity
          break
        case JustificationTargetType.JUSTIFICATION:
          justification.rootStatement = justification.target.entity.rootStatement
          break
        default:
          throw newExhaustedEnumError('JustificationTargetType', justification.target.type)
      }

      return [now, justification]
    })
    .then( ([now, justification]) => Promise.all([
      now,
      justification,
      server.justificationsDao.readJustificationEquivalentTo(justification)
    ]))
    .then( ([now, justification, equivalentJustification]) => Promise.all([
      now,
      justification,
      !!equivalentJustification,
      equivalentJustification || server.justificationsDao.createJustification(justification, userId, now)
    ]))
    .then( ([now, justification, isExtant, dbJustification]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      server.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.JUSTIFICATION, dbJustification.id)
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

    case JustificationTargetType.JUSTIFICATION:
      return service.readOrCreateJustificationAsUser(justificationTarget.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, justification}) => ({
          isExtant,
          targetType: justificationTarget.type,
          targetEntity: justification,
        }))

    case JustificationTargetType.STATEMENT:
      return service.statementsService.readOrCreateStatementAsUser(justificationTarget.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then(({isExtant, statement}) => ({
          isExtant,
          targetType: justificationTarget.type,
          targetEntity: statement,
        }))

    default:
      throw newImpossibleError(`Unsupported JustificationTargetType: ${justificationTarget.type}`)
  }
}

function readOrCreateJustificationBasis(service, justificationBasis, userId, now) {
  switch (justificationBasis.type) {

    case JustificationBasisType.WRIT_QUOTE:
      return service.writQuotesService.readOrCreateWritQuoteAsUser(justificationBasis.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, writQuote}) => ({
          isExtant,
          basisEntity: writQuote,
        }))

    case JustificationBasisType.STATEMENT_COMPOUND:
      // Statement compounds were per-justification, so we always created.  Not sure this actually makes sense now, but this is a legacy type anyways
      return service.statementCompoundsService.createStatementCompoundAsUser(justificationBasis.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, statementCompound}) => ({
          isExtant,
          basisEntity: statementCompound,
        }))

    case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
      return service.justificationBasisCompoundsService.readOrCreateJustificationBasisCompoundAsUser(justificationBasis.entity, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
        .then( ({isExtant, justificationBasisCompound}) => ({
          isExtant,
          basisType: JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
          basisEntity: justificationBasisCompound,
        }))

    default:
      throw newImpossibleError(`Unsupported JustificationBasisType: ${justificationBasis.type}`)
  }
}

function validateJustifications(logger, justifications) {
  const [goodJustifications, badJustifications] = partition(justifications, j =>
    j.basis.type !== JustificationBasisType.STATEMENT_COMPOUND ||
    j.basis.entity.atoms &&
    j.basis.entity.atoms.length > 0 &&
    every(j.basis.entity.atoms, a => isTruthy(a.entity.id))
  )
  if (badJustifications.length > 0) {
    logger.error(`these justifications have invalid statement compounds: ${join(map(badJustifications, j => j.id), ', ')}`)
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
      return justificationsDao.deleteCounterJustificationsToJustificationIds(justificationIds, now)
        .then(currentlyDeletedJustificationIds =>
          deleteCounterJustificationsToJustificationIds(justificationsDao, currentlyDeletedJustificationIds, userId, now,
            deletedJustificationIds.concat(currentlyDeletedJustificationIds))
        )
    })
}