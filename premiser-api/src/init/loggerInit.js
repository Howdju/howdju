/* This file must pass console to the Logger */
/* eslint "no-console": ["off"] */

const {AwsLogger} = require('howdju-service-common')

exports.init = function init(provider) {
  const logLevel = provider.getConfigVal('LOG_LEVEL', 'warn')
  const isAws = !!provider.getConfigVal('IS_AWS', 'warn')
  const doLogTimestamp = !isAws
  const doUseCarriageReturns = isAws
  const logFormat = isAws ? 'json' : 'text'

  const logger = new AwsLogger(console, {logLevel, doLogTimestamp, doUseCarriageReturns, logFormat})

  logger.debug('logLevel', logLevel)
  logger.debug('isAws', isAws)

  provider.logger = logger
}
