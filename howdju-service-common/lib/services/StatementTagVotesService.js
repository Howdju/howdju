const Promise = require('bluebird')

const {
  requireArgs,
  EntityNotFoundError,
  EntityType,
  EntityValidationError,
} = require('howdju-common')

exports.StatementTagVotesService = class StatementTagVotesService {

  constructor(
    logger,
    statementTagVoteValidator,
    authService,
    tagsService,
    statementTagVotesDao
  ) {
    requireArgs({
      logger,
      statementTagVoteValidator,
      authService,
      tagsService,
      statementTagVotesDao
    })

    this.logger = logger
    this.statementTagVoteValidator = statementTagVoteValidator
    this.authService = authService
    this.tagsService = tagsService
    this.statementTagVotesDao = statementTagVotesDao
  }

  readVotesForStatementIdAsUser(userId, statementId) {
    return this.statementTagVotesDao.readVotesForStatementIdAsUser(userId, statementId)
  }

  readOrCreateStatementTagVote(authToken, statementTagVote) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then((userId) => this.readOrCreateStatementTagVoteAsUser(userId, statementTagVote, new Date()))
  }

  readOrCreateStatementTagVoteAsUser(userId, statementTagVote, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.statementTagVoteValidator.validate(statementTagVote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.readOrCreateValidStatementTagVoteAsUser(userId, statementTagVote, now))
  }

  readOrCreateValidStatementTagVoteAsUser(userId, statementTagVote, now) {
    return Promise.resolve()
      .then(() => {
        if (statementTagVote.id) {
          return this.statementTagVotesDao.readStatementTagVoteForId(statementTagVote.id)
        }
        return null
      })
      .then((extantVote) => {
        if (extantVote) {
          return Promise.all([
            extantVote,
            this.tagsService.readTagForId(extantVote.tag.id),
          ])
        }
        return this.tagsService.readOrCreateValidTagAsUser(userId, statementTagVote.tag, now)
          .then((tag) => Promise.all([
            this.statementTagVotesDao.readStatementTagVote(userId, statementTagVote.statement.id, tag.id),
            tag
          ]))
      })
      .then(([overlappingVote, tag]) => {
        if (overlappingVote) {
          if (overlappingVote.polarity === statementTagVote.polarity) {
            return {
              redundantVote: overlappingVote,
              tag,
            }
          }
          // overlapping vote contradicts new vote, so delete it
          return Promise.props({
            tag,
            contradictoryVote: this.statementTagVotesDao.deleteStatementTagVote(userId, overlappingVote.id, now)
          })
        }
        return {tag}
      })
      .then(({redundantVote, tag}) => {
        if (redundantVote) {
          redundantVote.tag = tag
          return redundantVote
        }
        statementTagVote.tag = tag
        return this.statementTagVotesDao.createStatementTagVote(userId, statementTagVote, now)
          .then((statementTagVote) => {
            statementTagVote.tag = tag
            return statementTagVote
          })
      })
  }

  deleteStatementTagVoteForId(authToken, statementTagVoteId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then((userId) => Promise.all([
        this.statementTagVotesDao.deleteStatementTagVote(userId, statementTagVoteId, new Date()),
        userId,
      ]))
      .then( ([deletedStatementTagVoteId, userId]) => {
        if (!deletedStatementTagVoteId) {
          throw new EntityNotFoundError(EntityType.STATEMENT_TAG_VOTE, {userId, statementTagVoteId})
        }
        return deletedStatementTagVoteId
      })
  }
}