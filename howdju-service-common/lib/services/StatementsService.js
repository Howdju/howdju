const Promise = require('bluebird')
const moment = require('moment')

const concat = require('lodash/concat')
const filter = require('lodash/filter')
const keys = require('lodash/keys')
const map = require('lodash/map')
const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const toNumber = require('lodash/toNumber')

const {
  EntityTypes,
  SortDirection,
  userActionsConflictCodes,
  entityConflictCodes,
  authorizationErrorCodes,
  ActionType,
  ActionTargetType,
  isTruthy,
} = require('howdju-common')

const {
  StatementValidator,
} = require('../validators')
const {
  permissions
} = require('../permissions')
const {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  EntityNotFoundError,
  RequestValidationError,
  EntityValidationError,
  EntityConflictError,
  UserActionsConflictError,
  AuthorizationError,
  EntityTooOldToModifyError,
} = require('../serviceErrors')

exports.StatementsService = class StatementsService {

  constructor(config, statementValidator, actionsService, authService, statementsDao, permissionsDao, justificationsDao) {
    this.config = config
    this.statementValidator = statementValidator
    this.actionsService = actionsService
    this.authService = authService
    this.statementsDao = statementsDao
    this.permissionsDao = permissionsDao
    this.justificationsDao = justificationsDao
  }

  readStatementForId(statementId, {userId, authToken}) {
    return this.statementsDao.readStatementForId(statementId)
      .then(statement => {
        if (!statement) {
          throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
        }
        return statement
      })
  }

  readStatementEquivalentTo(statement) {
    return this.statementsDao.readStatementByText(statement.text)
  }

  readStatements({sorts, continuationToken = null, count = 25}) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      return this.readInitialStatements(sorts, countNumber)
    }
    return this.readMoreStatements(continuationToken, countNumber)
  }

  readInitialStatements(requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.statementsDao.readStatements(unambiguousSorts, count)
      .then(statements => {
        const continuationToken = createContinuationToken(unambiguousSorts, statements)
        return {
          statements,
          continuationToken,
        }
      })
  }

  readMoreStatements(continuationToken, count) {
    const {
      sorts,
      filters,
    } = decodeContinuationToken(continuationToken)
    return this.statementsDao.readMoreStatements(sorts, count)
      .then(statements => {
        const nextContinuationToken = createNextContinuationToken(sorts, statements, filters) || continuationToken
        return {
          statements,
          continuationToken: nextContinuationToken
        }
      })
  }

  updateStatement(authToken, statement) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.statementValidator.validate(statement)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({statement: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.statementsDao.countEquivalentStatements(statement),
        Promise.props({
          [userActionsConflictCodes.OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_STATEMENT]:
            this.statementsDao.hasOtherUsersRootedJustifications(statement, userId),
          [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT]:
            this.statementsDao.hasOtherUsersRootedJustificationsVotes(statement, userId),
          [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT]:
            this.statementsDao.isBasisToOtherUsersJustifications(statement, userId),
        }),
        this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
      ]))
      .then(([
        userId,
        equivalentStatementsCount,
        userActionConflicts,
        hasPermission,
      ]) => {
        if (equivalentStatementsCount > 0) {
          throw new EntityConflictError(merge(
            StatementValidator.blankErrors(),
            {
              hasErrors: true,
              fieldErrors: {
                text: [entityConflictCodes.ANOTHER_STATEMENT_HAS_EQUIVALENT_TEXT]
              }
            }
          ))
        } else if (!hasPermission) {
          const userActionConflictCodes = keys(pickBy(userActionConflicts))
          if (userActionConflictCodes.length > 0) {
            throw new UserActionsConflictError(merge(
              StatementValidator.blankErrors(),
              {
                hasErrors: true,
                modelErrors: userActionConflictCodes,
              }
            ))
          }
        }
        return userId
      })
      .then(userId => {
        const now = new Date()
        return Promise.all([
          userId,
          now,
          this.statementsDao.updateStatement(statement)
        ])
      })
      .then(([userId, now, updatedStatement]) => {
        if (!updatedStatement) {
          throw new EntityNotFoundError(EntityTypes.STATEMENT, statement.id)
        }

        this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.STATEMENT, updatedStatement.id)
        return updatedStatement
      })
  }

  deleteStatement(authToken, statementId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => Promise.all([
        userId,
        this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
        this.justificationsDao.readJustificationsDependentUponStatementId(statementId),
        this.statementsDao.readStatementForId(statementId),
      ]))
      .then(([userId, hasPermission, dependentJustifications, statement]) => {
        const now = new Date()
        const result = [userId, now, statement, dependentJustifications]

        if (!statement) {
          throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
        }
        if (hasPermission) {
          return result
        }
        if (userId !== statement.creatorUserId) {
          throw new AuthorizationError({modelErrors: [authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
        }

        const created = moment(statement.created)
        const graceCutoff = created.add.apply(created, this.config.modifyEntityGracePeriod)

        const nowMoment = moment(now)
        if (nowMoment.isAfter(graceCutoff)) {
          throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod)
        }

        const otherUsersJustificationsDependentUponStatement = filter(dependentJustifications, j => j.creatorUserId !== userId)
        if (otherUsersJustificationsDependentUponStatement.length > 0) {
          throw new UserActionsConflictError()
        }

        return result
      })
      .then(([userId, now, statement, dependentJustifications]) => Promise.all([
        userId,
        now,
        this.statementsDao.deleteStatement(statement, now),
        this.justificationsDao.deleteJustifications(dependentJustifications, now),
      ]))
      .then(([userId, now, deletedStatementId, deletedJustificationIds]) => Promise.all([
        deletedStatementId,
        deletedJustificationIds,
        this.actionsService.asyncRecordAction(userId, now, ActionType.DELETE, ActionTargetType.STATEMENT, deletedStatementId),
        Promise.all(map(deletedJustificationIds, id =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.DELETE, ActionTargetType.JUSTIFICATION, id)))
      ]))
      .then(([deletedStatementId, deletedJustificationIds]) => ({
        deletedStatementId,
        deletedJustificationIds,
      }))
  }

  getOrCreateStatement(authToken, statement) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const now = new Date()
        return this.getOrCreateStatementAsUser(statement, userId, now)
      })
  }

  getOrCreateStatementAsUser(statement, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.statementValidator.validate(statement)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.getOrCreateValidStatementAsUser(statement, userId, now))
  }

  getOrCreateValidStatementAsUser(statement, userId, now) {
    return Promise.resolve()
      .then(() => Promise.all([
        userId,
        isTruthy(statement.id) ?
          this.statementsDao.readStatementForId(statement.id) :
          this.statementsDao.readStatementByText(statement.text),
        now,
      ]))
      .then(([userId, extantStatement, now]) => {
        const isExtant = !!extantStatement
        return Promise.all([
          userId,
          now,
          isExtant,
          isExtant ? extantStatement : this.statementsDao.createStatement(userId, statement, now),
        ])
      })
      .then(([userId, now, isExtant, statement]) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.STATEMENT, statement.id)

        return {
          isExtant,
          statement,
        }
      })
  }
}
