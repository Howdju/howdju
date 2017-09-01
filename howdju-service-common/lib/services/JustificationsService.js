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
const set = require('lodash/set')
const partition = require('lodash/partition')
const toNumber = require('lodash/toNumber')

const {
  JustificationBasisType,
  SortDirection,
  isTruthy,
  UserActionsConflictError,
  EntityConflictError,
  EntityValidationError,
  JustificationTargetType,
  AuthorizationError,
  CANNOT_MODIFY_OTHER_USERS_ENTITIES,
  EDIT_ANY_ENTITY,
  ActionType,
  ActionTargetType,
  newImpossibleError,
} = require('howdju-common')

const {
  createSorts,
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  RequestValidationError,
  EntityTooOldToModifyError,
} = require('../serviceErrors')
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
          deleteCounterJustificationsToJustificationIds(currentlyDeletedJustificationIds, userId, now,
            deletedJustificationIds.concat(currentlyDeletedJustificationIds))
        )
    })

exports.JustificationsService = class JustificationsService {

  constructor(config, logger, justificationValidator, actionsService, authService, justificationsDao, permissionsDao) {
    this.config = config
    this.logger = logger
    this.justificationValidator = justificationValidator
    this.actionsService = actionsService
    this.authService = authService
    this.justificationsDao = justificationsDao
    this.permissionsDao = permissionsDao
  }

  readJustifications({
    continuationToken,
    sortProperty = 'created',
    sortDirection = SortDirection.ASCENDING,
    count = 25,
    filters,
  }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }
    if (filters && filter(filters).length > 1) {
      throw new RequestValidationError("Only one filter is supported because justifications have one basis.")
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
      return this.readInitialJustifications(sorts, countNumber, filters)
    }
    return this.readMoreJustifications(continuationToken, countNumber)
  }

  readInitialJustifications(requestedSorts, count, filters) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.justificationsDao.readJustifications(unambiguousSorts, count, filters)
      .then(justifications => {
        const continuationToken = createContinuationToken(unambiguousSorts, justifications, filters)
        return {
          justifications,
          continuationToken,
        }
      })
  }

  readMoreJustifications(continuationToken, count) {
    const continuationInfo = decodeContinuationToken(continuationToken)
    const {
      s: sortContinuations,
      f: filters,
    } = continuationInfo
    return this.justificationsDao.readJustifications(sortContinuations, count, filters, true)
      .then(justifications => {
        const [goodJustifications, badJustifications] = partition(justifications, j =>
          j.basis.type !== JustificationBasisType.STATEMENT_COMPOUND ||
          j.basis.entity.atoms &&
          j.basis.entity.atoms.length > 0 &&
          every(j.basis.entity.atoms, a => isTruthy(a.statement.id))
        )
        if (badJustifications.length > 0) {
          this.logger.error(`these justifications have invalid statement compounds: ${join(map(badJustifications, j => j.id), ', ')}`)
          this.logger.error(badJustifications)
        }
        return goodJustifications
      })
      .then(justifications => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, justifications, filters) || continuationToken
        return {
          justifications,
          continuationToken: nextContinuationToken
        }
      })
  }

  createJustification(authToken, justification) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => this.createJustificationAsUser(justification, userId, new Date()))
  }

  createJustificationAsUser(justification, userId, now) {
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
          .then( ([userId, now]) => this.createValidJustificationAsUser(justification, userId, now))
      })
  }

  createValidJustificationAsUser(justification, userId, now) {
    return Promise.all([
      now,
      this.createJustificationTarget(justification.target, userId, now)
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.target')),
      this.createJustificationBasis(justification.basis, userId, now)
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
          const rootStatementId = get(justification, 'rootStatement.id')
          if (rootStatementId && rootStatementId !== targetEntity.id) {
            this.logger.warning(`Statement-targeting justification's rootStatementId (${rootStatementId} is not equal to targetEntity.id (${targetEntity.id})`)
          }
          set(justification, 'rootStatement.id', targetEntity.id)
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

  createJustificationTarget(justificationTarget, userId, now) {
    switch (justificationTarget.type) {

      case JustificationTargetType.JUSTIFICATION:
        return this.createJustificationAsUser(justificationTarget.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, justification}) => ({
            isExtant,
            targetType: justificationTarget.type,
            targetEntity: justification,
          }))

      case JustificationTargetType.STATEMENT:
        return this.createStatementAsUser(justificationTarget.entity, userId, now)
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

  createJustificationBasis(justificationBasis, userId, now) {
    switch (justificationBasis.type) {

      case JustificationBasisType.CITATION_REFERENCE:
        return this.createCitationReferenceAsUser(justificationBasis.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, citationReference}) => ({
            isExtant,
            basisType: JustificationBasisType.CITATION_REFERENCE,
            basisEntity: citationReference,
          }))

      case JustificationBasisType.STATEMENT_COMPOUND:
        return this.createStatementCompoundAsUser(justificationBasis.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, statementCompound}) => ({
            isExtant,
            basisType: JustificationBasisType.STATEMENT_COMPOUND,
            basisEntity: statementCompound,
          }))

      default:
        throw newImpossibleError(`Unsupported JustificationBasisType: ${justificationBasis.type}`)
    }
  }

  deleteJustification(authToken, justificationId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => Promise.all([
        userId,
        this.permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
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
        deleteCounterJustificationsToJustificationIds([justification.id], userId, now),
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