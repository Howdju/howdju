const Promise = require('bluebird')

const {
  EntityTypes
} = require('howdju-common')

const {
  EntityValidationError,
  EntityNotFoundError,
} = require('../serviceErrors')

exports.VotesService = class VotesService {

  constructor(logger, voteValidator, authService, votesDao) {
    this.logger = logger
    this.voteValidator = voteValidator
    this.authService = authService
    this.votesDao = votesDao
  }

  createVote({authToken, vote}) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.voteValidator.validate(vote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({vote: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.votesDao.deleteOpposingVotes(userId, vote),
        this.votesDao.readEquivalentVotes(userId, vote),
      ]))
      .then(([userId, updatedOpposingVoteIds, equivalentVotes]) => {
        if (updatedOpposingVoteIds.length > 0) {
          this.logger.debug(`Deleted ${updatedOpposingVoteIds.length} opposing votes`, vote)
        }
        if (equivalentVotes.length > 0) {
          if (equivalentVotes.length > 1) {
            this.logger.error(`${equivalentVotes.length} equivalent votes exist`, equivalentVotes, vote)
          }
          const equivalentVote = equivalentVotes[0]
          this.logger.debug('Equivalent vote already exists', equivalentVote, vote)
          return equivalentVote
        } else {
          return this.votesDao.createVote(userId, vote)
        }
      })
  }

  deleteVote({authToken, vote}) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.voteValidator.validate(vote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({vote: validationErrors})
        }
        return userId
      })
      .then(userId => this.votesDao.deleteEquivalentVotes(userId, vote))
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
