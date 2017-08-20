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
    if (process.env.NODE_ENV === 'development') {
      // Sentry wraps all console methods and so will send this to the system too
      logger[level](ex);
    }
    sentry.captureException(ex, extra)
  }
}

export const isScrollPastTop = () => window.document.body.scrollTop < 0

export const isScrollPastBottom = () => {
  // Some references for figuring this issue out:
  // https://stackoverflow.com/a/40370876/39396
  // https://stackoverflow.com/a/27335321/39396
  const body = window.document.body
  return body.scrollTop + window.innerHeight > body.scrollHeight
}

export const getDimensionInfo = () => {
  const {
    documentElement,
    body
  } = window.document
  const dimensionInfo = {
    window: {
      innerHeight: window.innerHeight,
      outerHeight: window.outerHeight,
      pageYOffset: window.pageYOffset,
      scrollY: window.scrollY,
    },
    documentElement: {
      scrollTop: documentElement.scrollTop,
      scrollHeight: documentElement.scrollHeight,
      clientHeight: documentElement.clientHeight,
      offsetHeight: documentElement.offsetHeight,
    },
    body: {
      scrollTop: body.scrollTop,
      clientHeight: body.clientHeight,
      offsetHeight: body.offsetHeight,
      scrollHeight: body.scrollHeight,
    },
    conditions: {
      [`window.innerHeight + window.pageYOffset >= document.body.offsetHeight : ${window.innerHeight} + ${window.pageYOffset} = ${window.innerHeight + window.pageYOffset} >= ${document.body.offsetHeight}`]: (window.innerHeight + window.pageYOffset >= document.body.offsetHeight),
      [`documentElement.clientHeight + window.pageYOffset >= document.body.offsetHeight : ${documentElement.clientHeight} + ${window.pageYOffset} = ${documentElement.clientHeight + window.pageYOffset} >= ${document.body.offsetHeight}`]: (documentElement.clientHeight + window.pageYOffset >= document.body.offsetHeight),
      [`body.scrollTop + window.innerHeight >= body.scrollHeight : ${body.scrollTop} + ${window.innerHeight} = ${body.scrollTop + window.innerHeight} >= body.scrollHeight`]: body.scrollTop + window.innerHeight >= body.scrollHeight,
    }
  }
  return dimensionInfo
}