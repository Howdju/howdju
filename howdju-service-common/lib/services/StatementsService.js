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
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT,
  OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT,
  OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT,
  OTHER_STATEMENTS_HAVE_EQUIVALENT_TEXT_CONFLICT,
  CANNOT_MODIFY_OTHER_USERS_ENTITIES,
  StatementValidator,
  ActionType,
  ActionTargetType,
  isTruthy,
} = require('howdju-common')

const {
  EDIT_ANY_ENTITY
} = require('../permissions')
const {
  createSorts,
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

  readStatement(statementId) {
    return this.statementsDao.readStatementById(statementId)
      .then(statement => {
        if (!statement) {
          throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
        }
        return statement
      })
  }

  readStatements({continuationToken = null, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
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
      s: sortContinuations,
      f: filters,
    } = decodeContinuationToken(continuationToken)
    return this.statementsDao.readMoreStatements(sortContinuations, count)
      .then(statements => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, statements, filters) || continuationToken
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
          [OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT]: this.statementsDao.hasOtherUsersRootedJustifications(statement, userId),
          [OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT]: this.statementsDao.hasOtherUsersRootedJustificationsVotes(statement, userId),
          [OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT]: this.statementsDao.isBasisToOtherUsersJustifications(statement, userId),
        }),
        this.permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
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
                text: [OTHER_STATEMENTS_HAVE_EQUIVALENT_TEXT_CONFLICT]
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
        this.permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
        this.justificationsDao.readJustificationsDependentUponStatementId(statementId),
        this.statementsDao.readStatementById(statementId),
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
          throw new AuthorizationError({modelErrors: [CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
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

  createStatement({authToken, statement}) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const now = new Date()
        return this.createStatementAsUser(statement, userId, now)
      })
  }

  createStatementAsUser(statement, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.statementValidator.validate(statement)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.createValidStatementAsUser(statement, userId, now))
  }

  createValidStatementAsUser(statement, userId, now) {
    return Promise.resolve()
      .then(() => Promise.all([
        userId,
        isTruthy(statement.id) ? statement : this.statementsDao.readStatementByText(statement.text),
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
