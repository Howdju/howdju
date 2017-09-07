const forEach = require('lodash/forEach')
const isFunction = require('lodash/isFunction')
const isUndefined = require('lodash/isUndefined')
const moment = require('moment')


const {
  newArgumentsError
} = require('./commonErrors')

const _e = module.exports

// https://stackoverflow.com/a/27093173/39396
_e.minDate = () => new Date(-8640000000000000)

_e.zeroDate = () => new Date(0)

_e.isTruthy = (val) => !!val

_e.assert = (test, message) => {
  const makeMessage = message =>
    // If there is a message thunk, use it
    isFunction(message) ?
      message() :
      // Otherwise if there is a message, us it
      message ?
        message :
        // Otherwise, if the test was a thunk, use it as a description
        isFunction(test) ?
          test.toString().substring(0, 1024) :
          // Otherwise, not much else we can do
          message

  // assert should only be used in development, so logging to the console should be ok.  Besides, how would we get a logger here?
  /* eslint-disable no-console */
  const logError = message => console.error("Failed assertion: " + makeMessage(message))
  /* eslint-enable no-console */

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

_e.isDefined = val => !isUndefined(val)

_e.utcNow = () => moment.utc()

_e.timestampFormatString = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

_e.utcTimestamp = () => _e.utcNow().format(_e.timestampFormatString)

_e.requireArgs = (requiredArgs) => {
  const missing = []
  forEach(requiredArgs, (value, name) => {
    if (!_e.isDefined(value)) {
      missing.push(name)
    }
  })

  if (missing.length > 0) {
    throw newArgumentsError(`Required arguments are undefined: ${missing.join(', ')}`)
  }
  return true
}