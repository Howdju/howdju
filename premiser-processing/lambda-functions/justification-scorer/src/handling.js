const {
  configureGatewayContext,
} = require('howdju-service-common')

const {
  justificationScoresService,
  logger,
} = require('./initialization')

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  configureGatewayContext(gatewayContext)

  logger.silly('gatewayEvent:', gatewayEvent)
  logger.silly('gatewayContext:', gatewayContext)

  justificationScoresService.updateJustificationScoresHavingNewVotes()
    .then(() => gatewayCallback(null, `Scoring justifications succeeded`))
    .catch( (err) => {
      logger.error(err)
      return gatewayCallback(err)
    })
}
