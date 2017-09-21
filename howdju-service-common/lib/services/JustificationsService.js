const Promise = require('bluebird')
const moment = require('moment')

const cloneDeep = require('lodash/cloneDeep')
const concat = require('lodash/concat')
const every = require('lodash/every')
const filter = require('lodash/filter')
const isFinite = require('lodash/isFinite')
const isUndefined = require('lodash/isUndefined')
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


const deleteCounterJustificationsToJustificationIds = (
  justificationsDao,
  justificationIds,
  userId,
  now,
  deletedJustificationIds = []
) =>
  Promise.resolve()
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

  getOrCreateJustification(authToken, justification) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => this.getOrCreateJustificationAsUser(justification, userId, new Date()))
  }

  getOrCreateJustificationAsUser(justification, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (justification.id) {
          return {justification, isExtant: true}
        }
        return Promise.resolve()
          .then(() => {
            const validationErrors = this.justificationValidator.validate(justification)
            if (validationErrors.hasErrors) {
              throw new EntityValidationError(validationErrors)
            }
            return [userId, now]
          })
          .then( ([userId, now]) => this.getOrCreateValidJustificationAsUser(justification, userId, now))
      })
  }

  getOrCreateValidJustificationAsUser(justification, userId, now) {
    return Promise.all([
      now,
      this.getOrCreateJustificationTarget(justification.target, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.target')),
      this.getOrCreateJustificationBasis(justification.basis, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.basis')),
    ])
      .then( ([
        now,
        {targetType, targetEntity},
        {basisType, basisEntity}
      ]) => {
        justification = cloneDeep(justification)

        justification.target = {
          type: targetType,
          entity: targetEntity,
        }
        if (targetType === JustificationTargetType.STATEMENT) {
          if (!justification.rootStatement) {
            justification.rootStatement = targetEntity
          } else if (isUndefined(justification.rootStatement.id)) {
            justification.rootStatement = targetEntity
          } else if (!idEqual(justification.rootStatement.id, targetEntity.id)) {
            this.logger.warn(`Statement-targeting justification's rootStatement.id (${justification.rootStatement.id} is not equal to targetEntity.id (${targetEntity.id})`)
            justification.rootStatement = targetEntity
          }
        }

        justification.basis = {
          type: basisType,
          entity: basisEntity
        }
        return [now, justification]
      })
      .then( ([now, justification]) => Promise.all([
        now,
        justification,
        this.justificationsDao.readJustificationEquivalentTo(justification)
      ]))
      .then( ([now, justification, equivalentJustification]) => Promise.all([
        now,
        justification,
        !!equivalentJustification,
        equivalentJustification || this.justificationsDao.createJustification(justification, userId, now)
      ]))
      .then( ([now, justification, isExtant, dbJustification]) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.JUSTIFICATION, dbJustification.id)
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

  getOrCreateJustificationTarget(justificationTarget, userId, now) {
    switch (justificationTarget.type) {

      case JustificationTargetType.JUSTIFICATION:
        return this.getOrCreateJustificationAsUser(justificationTarget.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, justification}) => ({
            isExtant,
            targetType: justificationTarget.type,
            targetEntity: justification,
          }))

      case JustificationTargetType.STATEMENT:
        return this.statementsService.getOrCreateStatementAsUser(justificationTarget.entity, userId, now)
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

  getOrCreateJustificationBasis(justificationBasis, userId, now) {
    switch (justificationBasis.type) {

      case JustificationBasisType.WRIT_QUOTE:
        return this.writQuotesService.getOrCreateWritQuoteAsUser(justificationBasis.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, writQuote}) => ({
            isExtant,
            basisType: JustificationBasisType.WRIT_QUOTE,
            basisEntity: writQuote,
          }))

      case JustificationBasisType.STATEMENT_COMPOUND:
        return this.statementCompoundsService.createStatementCompoundAsUser(justificationBasis.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, statementCompound}) => ({
            isExtant,
            basisType: JustificationBasisType.STATEMENT_COMPOUND,
            basisEntity: statementCompound,
          }))

      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        return this.justificationBasisCompoundsService.getOrCreateJustificationBasisCompoundAsUser(justificationBasis.entity, userId, now)
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

  deleteJustification(authToken, justificationId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => Promise.all([
        userId,
        this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
        this.justificationsDao.readJustificationById(justificationId),
      ]))
      .then(([userId, hasPermission, justification]) => {
        const now = new Date()
        const result = [userId, now, justification]

        if (hasPermission) {
          return result
        }

        if (userId !== justification.creatorUserId) {
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