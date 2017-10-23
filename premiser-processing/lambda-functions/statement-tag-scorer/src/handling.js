const {
  configureGatewayContext,
} = require('howdju-service-common')

const {
  statementTagScoresService,
  logger,
} = require('./initialization')

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  configureGatewayContext(gatewayContext)

  logger.silly('gatewayEvent:', gatewayEvent)
  logger.silly('gatewayContext:', gatewayContext)

  statementTagScoresService.updateStatementTagScoresUsingUnscoredVotes()
    .then(() => gatewayCallback(null, 'Scoring statement tags succeeded'))
    .catch( (err) => {
      logger.error('Scoring statement tags failed', err)
      return gatewayCallback(err)
    })
}
