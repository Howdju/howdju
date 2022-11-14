const Promise = require('bluebird')

const {
  EntityTypes,
} = require('howdju-common')

const {
  EntityValidationError,
  EntityNotFoundError,
} = require('../serviceErrors')

exports.JustificationVotesService = class JustificationVotesService {

  constructor(logger, justificationVoteValidator, authService, justificationVotesDao) {
    this.logger = logger
    this.justificationVoteValidator = justificationVoteValidator
    this.authService = authService
    this.justificationVotesDao = justificationVotesDao
  }

  createVote(authToken, vote) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.justificationVoteValidator.validate(vote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({vote: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.justificationVotesDao.deleteOpposingVotes(userId, vote),
        this.justificationVotesDao.readEquivalentVotes(userId, vote),
      ]))
      .then(([userId, updatedOpposingVoteIds, equivalentVotes]) => {
        if (updatedOpposingVoteIds.length > 0) {
          this.logger.debug(`Deleted ${updatedOpposingVoteIds.length} opposing justification votes`, {vote})
        }
        if (equivalentVotes.length > 0) {
          if (equivalentVotes.length > 1) {
            this.logger.error(`${equivalentVotes.length} equivalent justification votes exist`, {equivalentVotes, vote})
          }
          const equivalentVote = equivalentVotes[0]
          this.logger.debug('Equivalent vote already exists', {equivalentVote, vote})
          return equivalentVote
        } else {
          return this.justificationVotesDao.createVote(userId, vote)
        }
      })
  }

  deleteVote(authToken, vote) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.justificationVoteValidator.validate(vote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({vote: validationErrors})
        }
        return userId
      })
      .then(userId => this.justificationVotesDao.deleteEquivalentVotes(userId, vote))
      .then(deletedVoteIds => {
        if (deletedVoteIds.length === 0) {
          this.logger.debug('No votes to unvote')
          throw new EntityNotFoundError(EntityTypes.VOTE, vote.id)
        } else if (deletedVoteIds.length > 1) {
          this.logger.warn(`Deleted ${deletedVoteIds.length} votes at once!`)
        }
        return deletedVoteIds
      })
  }
}
