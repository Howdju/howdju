/* eslint-disable no-console */
import config from './config'
import * as sentry from './sentry'

const logFunctions = {
  error: console.error || console.log,
  warn: console.warn || console.log,
  info: console.info || console.log,
  debug: console.debug || console.log,
  trace: console.trace || console.log,
}
export const logger = {
  error: message => {
    logFunctions.error(message)
    sentry.captureMessage(message)
    // sentry.showReportDialog()
  },
  warn: console.warn || console.log,
  info: console.info || console.log,
  debug: console.debug || console.log,
  trace: console.trace || console.log,
  exception: (err, options = {}) => {
    const {level = 'error', extra} = options
    if (config.isDev) {
      // Sentry wraps all console methods and so will send this to the system too
      logger[level](err)
    }
    sentry.captureException(err, extra)
  }
}
