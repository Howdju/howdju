const {
  configureGatewayContext,
} = require('howdju-service-common')

const {
  propositionTagScoresService,
  logger,
} = require('./initialization')

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  configureGatewayContext(gatewayContext)

  logger.silly({gatewayContext, gatewayEvent})

  propositionTagScoresService.updatePropositionTagScoresUsingUnscoredVotes()
    .then(() => gatewayCallback(null, 'Scoring proposition tags succeeded'))
    .catch( (err) => {
      logger.error('Scoring proposition tags failed', {err})
      return gatewayCallback(err)
    })
}
