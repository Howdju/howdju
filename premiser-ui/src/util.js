import isFunction from 'lodash/isFunction'
import config from './config'
import * as sentry from './sentry'

export function extractDomain(url) {

  let domain = null;
  if (!url) {
    return domain
  }

  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return domain;
}

export const isTruthy = val => !!val

export function assert(test, message) {
  const makeMessage = message =>
      // If there is a message thunk, use it
      isFunction(message) ?
        message() :
        // Otherwise if there is a message, us it
        !!message ?
            message :
            // Otherwise, if the test was a thunk, use it as a description
            isFunction(test) ?
                test.toString().substring(0, 1024) :
                // Otherwise, not much else we can do
                message

  const logError = message => logger.error("Failed assertion: " + makeMessage(message))

  if (process.env.DO_ASSERT === 'true') {
    if (isFunction(test)) {
      if (!test()) {
        logError(message)
      }
    } else if (!test) {
      logError(message)
    }
  }
}

export const isWindowNarrow = () => {
  return window.innerWidth < config.ui.narrowBreakpoint
}

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
  exception: (ex, options = {}) => {
    const {level = 'error', extra} = options
    sentry.captureException(ex, extra)
    logger[level](ex);
  }
}