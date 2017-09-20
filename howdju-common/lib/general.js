const forEach = require('lodash/forEach')
const isArray = require('lodash/isArray')
const isFunction = require('lodash/isFunction')
const isNumber = require('lodash/isNumber')
const isUndefined = require('lodash/isUndefined')
const reduce = require('lodash/reduce')
const moment = require('moment')


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

_e.arrayToObject = (codes) => reduce(codes, (acc, code) => {
  acc[code] = code
  return acc
}, {})

_e.pushAll = (target, source) => {
  forEach(source, item => {
    target.push(item)
  })
  return target
}

_e.insertAt = (array, index, item) => {
  if (!isArray(array)) {
    throw new Error('first argument must be an array; was: ' + typeof(array))
  }
  if (!isNumber(index)) {
    throw new Error('second argument must be number; was: ' + typeof(index))
  }
  const i = isUndefined(index) ? array.length : index
  array.splice(i, 0, item)
  return array
}

_e.removeAt = (array, index) => {
  array.splice(index, 1)
  return array
}