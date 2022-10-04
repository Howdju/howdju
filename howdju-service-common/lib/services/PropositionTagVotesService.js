const Promise = require('bluebird')

const {
  requireArgs,
  EntityNotFoundError,
  EntityType,
  EntityValidationError,
} = require('howdju-common')

exports.PropositionTagVotesService = class PropositionTagVotesService {

  constructor(
    logger,
    propositionTagVoteValidator,
    authService,
    tagsService,
    propositionTagVotesDao
  ) {
    requireArgs({
      logger,
      propositionTagVoteValidator,
      authService,
      tagsService,
      propositionTagVotesDao
    })

    this.logger = logger
    this.propositionTagVoteValidator = propositionTagVoteValidator
    this.authService = authService
    this.tagsService = tagsService
    this.propositionTagVotesDao = propositionTagVotesDao
  }

  readVotesForPropositionIdAsUser(userId, propositionId) {
    return this.propositionTagVotesDao.readVotesForPropositionIdAsUser(userId, propositionId)
  }

  readOrCreatePropositionTagVote(authToken, propositionTagVote) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then((userId) => this.readOrCreatePropositionTagVoteAsUser(userId, propositionTagVote, new Date()))
  }

  readOrCreatePropositionTagVoteAsUser(userId, propositionTagVote, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.propositionTagVoteValidator.validate(propositionTagVote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.readOrCreateValidPropositionTagVoteAsUser(userId, propositionTagVote, now))
  }

  readOrCreateValidPropositionTagVoteAsUser(userId, propositionTagVote, now) {
    return Promise.resolve()
      .then(() => {
        if (propositionTagVote.id) {
          return this.propositionTagVotesDao.readPropositionTagVoteForId(propositionTagVote.id)
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
        // TODO(1,2,3): remove exception
        // eslint-disable-next-line promise/no-nesting
        return this.tagsService.readOrCreateValidTagAsUser(userId, propositionTagVote.tag, now)
          .then((tag) => Promise.all([
            this.propositionTagVotesDao.readPropositionTagVote(userId, propositionTagVote.proposition.id, tag.id),
            tag
          ]))
      })
      .then(([overlappingVote, tag]) => {
        if (overlappingVote) {
          if (overlappingVote.polarity === propositionTagVote.polarity) {
            return {
              redundantVote: overlappingVote,
              tag,
            }
          }
          // overlapping vote contradicts new vote, so delete it
          return Promise.props({
            tag,
            contradictoryVote: this.propositionTagVotesDao.deletePropositionTagVote(userId, overlappingVote.id, now)
          })
        }
        return {tag}
      })
      .then(({redundantVote, tag}) => {
        if (redundantVote) {
          redundantVote.tag = tag
          return redundantVote
        }
        propositionTagVote.tag = tag
        // TODO(1,2,3): remove exception
        // eslint-disable-next-line promise/no-nesting
        return this.propositionTagVotesDao.createPropositionTagVote(userId, propositionTagVote, now)
          .then((propositionTagVote) => {
            propositionTagVote.tag = tag
            return propositionTagVote
          })
      })
  }

  deletePropositionTagVoteForId(authToken, propositionTagVoteId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then((userId) => Promise.all([
        this.propositionTagVotesDao.deletePropositionTagVote(userId, propositionTagVoteId, new Date()),
        userId,
      ]))
      .then( ([deletedPropositionTagVoteId, userId]) => {
        if (!deletedPropositionTagVoteId) {
          throw new EntityNotFoundError(EntityType.PROPOSITION_TAG_VOTE, {userId, propositionTagVoteId})
        }
        return deletedPropositionTagVoteId
      })
  }
}
