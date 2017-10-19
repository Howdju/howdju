const Promise = require('bluebird')
const moment = require('moment')

const concat = require('lodash/concat')
const filter = require('lodash/filter')
const has = require('lodash/has')
const keys = require('lodash/keys')
const map = require('lodash/map')
const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const reduce = require('lodash/reduce')
const reject = require('lodash/reject')
const some = require('lodash/some')
const toNumber = require('lodash/toNumber')
const unionBy = require('lodash/unionBy')
const unzip = require('lodash/unzip')

const {
  EntityType,
  SortDirection,
  userActionsConflictCodes,
  entityConflictCodes,
  authorizationErrorCodes,
  ActionType,
  ActionTargetType,
  requireArgs,
  StatementTagVotePolarity,
  makeStatementTagVote,
  tagEqual,
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

  constructor(
    config,
    statementValidator,
    actionsService,
    authService,
    statementTagsService,
    statementTagVotesService,
    tagsService,
    statementsDao,
    permissionsDao,
    justificationsDao
  ) {
    requireArgs({
      config,
      statementValidator,
      actionsService,
      authService,
      statementTagsService,
      statementTagVotesService,
      tagsService,
      statementsDao,
      permissionsDao,
      justificationsDao,
    })

    this.config = config
    this.statementValidator = statementValidator
    this.actionsService = actionsService
    this.authService = authService
    this.statementTagsService = statementTagsService
    this.statementTagVotesService = statementTagVotesService
    this.tagsService = tagsService
    this.statementsDao = statementsDao
    this.permissionsDao = permissionsDao
    this.justificationsDao = justificationsDao
  }

  readStatementForId(statementId, {userId, authToken}) {
    return Promise.resolve()
      .then(() => userId || this.authService.readOptionalUserIdForAuthToken(authToken))
      .then((userId) => Promise.all([
        this.statementsDao.readStatementForId(statementId),
        this.statementTagsService.readTagsForStatementId(statementId),
        this.statementTagsService.readRecommendedTagsForStatementId(statementId),
        userId && this.statementTagVotesService.readVotesForStatementIdAsUser(userId, statementId),
      ]))
      .then(([statement, tags, recommendedTags, statementTagVotes]) => {
        if (!statement) {
          throw new EntityNotFoundError(EntityType.STATEMENT, statementId)
        }
        // Ensure recommended tags also appear in full tags
        statement.tags = unionBy(tags, recommendedTags, tag => tag.id)
        statement.recommendedTags = recommendedTags
        if (statementTagVotes) {
          // Include only votes for present tags
          statement.statementTagVotes = filter(statementTagVotes, vote => some(statement.tags, tag => tagEqual(tag, vote.tag)))
        }
        return statement
      })
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

  readStatementsForIds(statementsIds) {
    return this.statementsDao.readStatementsForIds(statementsIds)
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
          throw new EntityNotFoundError(EntityType.STATEMENT, statement.id)
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
          throw new EntityNotFoundError(EntityType.STATEMENT, statementId)
        }
        if (hasPermission) {
          return result
        }
        const creatorUserId = get(statement, 'creator.id')
        if (!creatorUserId || userId !== creatorUserId) {
          throw new AuthorizationError({modelErrors: [authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
        }

        const created = moment(statement.created)
        const graceCutoff = created.add.apply(created, this.config.modifyEntityGracePeriod)

        const nowMoment = moment(now)
        if (nowMoment.isAfter(graceCutoff)) {
          throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod)
        }

        const otherUsersJustificationsDependentUponStatement = filter(dependentJustifications, j => get(j, 'creator.id') !== userId)
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

  readOrCreateStatement(authToken, statement) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const now = new Date()
        return this.readOrCreateStatementAsUser(statement, userId, now)
      })
  }

  readOrCreateStatementAsUser(statement, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.statementValidator.validate(statement)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.readOrCreateValidStatementAsUser(statement, userId, now))
  }

  readOrCreateValidStatementAsUser(statement, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (statement.id) {
          return Promise.props({
            isExtant: true,
            statement: this.readStatementForId(statement.id, {userId})
          })
        }

        return readOrCreateEquivalentValidStatementAsUser(this, statement, userId, now)
      })
      .then((wrapper) => {
        if (statement.tags) {
          // When creating a statement, assume all tags are also votes.
          // (Anti-votes don't make any sense, because anti-votes are votes against tags recommended by the system
          //  based upon other users' activity.  But new statements don't have other user activity, and so have no
          //  recommended tags against which to vote)
          return readOrCreateTagsAndVotes(this, userId, wrapper.statement.id, statement.tags, now)
            .then(([tags, statementTagVotes]) => {
              wrapper.statement.tags = tags
              statement.statementTagVotes = statementTagVotes
              return wrapper
            })
        }
        return wrapper
      })
  }

  readStatementsForTagId(tagId, {userId, authToken}) {
    return Promise.resolve()
      .then(() => userId || this.authService.readOptionalUserIdForAuthToken(authToken))
      .then((userId) => Promise.all([
        this.statementTagsService.readStatementsRecommendedForTagId(tagId),
        userId && this.statementTagsService.readTaggedStatementsByVotePolarityAsUser(userId, tagId),
      ]))
      .then(([recommendedStatements, userTaggedStatementsByVotePolarity]) => {
        const {
          [StatementTagVotePolarity.POSITIVE]: taggedPositiveStatements,
          [StatementTagVotePolarity.NEGATIVE]: taggedNegativeStatements,
        } = userTaggedStatementsByVotePolarity

        const taggedNegativeStatementIds = reduce(taggedNegativeStatements, (acc, s, id) => {
          acc[id] = true
        }, {})
        const prunedStatements = reject(recommendedStatements, rs => has(taggedNegativeStatementIds, rs.id))
        const statements = unionBy(taggedPositiveStatements, prunedStatements, s => s.id)

        return statements
      })
  }
}

function readOrCreateEquivalentValidStatementAsUser(service, statement, userId, now) {
  return Promise.resolve()
    .then(() => Promise.all([
      userId,
      service.statementsDao.readStatementByText(statement.text),
      now,
    ]))
    .then(([userId, extantStatement, now]) => {
      const isExtant = !!extantStatement
      return Promise.all([
        userId,
        now,
        isExtant,
        isExtant ? extantStatement : service.statementsDao.createStatement(userId, statement, now),
      ])
    })
    .then(([userId, now, isExtant, statement]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.STATEMENT, statement.id)

      return {
        isExtant,
        statement,
      }
    })
}

function readOrCreateTagsAndVotes(service, userId, statementId, tags, now) {
  return Promise.all(map(tags, tag =>
    service.tagsService.readOrCreateValidTagAsUser(userId, tag, now)
      .then((tag) => {
        const statementTagVote = makeStatementTagVote({
          statement: {id: statementId},
          tag,
          polarity: StatementTagVotePolarity.POSITIVE,
        })
        return Promise.all([
          tag,
          service.statementTagVotesService.readOrCreateStatementTagVoteAsUser(userId, statementTagVote, now),
        ])
      })
  ))
    // Split the tags and votes
    .then((tagAndVotes) => unzip(tagAndVotes))
}
