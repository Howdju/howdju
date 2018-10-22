const Promise = require('bluebird')

const {
  EntityType,
  requireArgs,
} = require('howdju-common')

const {
  EntityNotFoundError
} = require('../serviceErrors')

exports.PropositionJustificationsService = class PropositionJustificationsService {

  constructor(authService, propositionsService, justificationsService) {
    requireArgs({authService, propositionsService, justificationsService})
    this.authService = authService
    this.propositionsService = propositionsService
    this.justificationsService = justificationsService
  }

  readPropositionJustifications(propositionId, authToken) {
    return this.authService.readOptionalUserIdForAuthToken(authToken)
      .then( (userId) => Promise.all([
        this.propositionsService.readPropositionForId(propositionId, {userId}),
        this.justificationsService.readJustificationsWithBasesAndVotesByRootPropositionId(propositionId, {userId}),
      ]))
      .then(([proposition, justifications]) => {
        if (!proposition) {
          throw new EntityNotFoundError(EntityType.PROPOSITION, propositionId)
        }

        return {
          proposition,
          justifications,
        }
      })
  }
}
