const {
  configureGatewayContext,
} = require('howdju-service-common')

const {
  justificationScoresService,
  logger,
} = require('./initialization')

const configureLogger = (gatewayEvent, gatewayContext) => {
  if (gatewayContext.isLocal) {
    logger.doUseCarriageReturns = false
  }

  const envLogLevel = process.env['LOG_LEVEL']
  if (envLogLevel) {
    const previousLogLevel = logger.logLevel
    logger.logLevel = envLogLevel
    logger.silly(`Setting logger to stage logLevel ${envLogLevel} (was ${previousLogLevel})`)
  }
}

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  configureGatewayContext(gatewayContext)
  configureLogger(gatewayEvent, gatewayContext)

  logger.silly('gatewayEvent:', gatewayEvent)
  logger.silly('gatewayContext:', gatewayContext)

  justificationScoresService.updateJustificationScoresHavingNewVotes()

  gatewayCallback(null, 'justificationScorer done')
}
