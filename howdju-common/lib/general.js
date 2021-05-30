const cloneDeepWith = require('lodash/cloneDeepWith')
const forEach = require('lodash/forEach')
const isArray = require('lodash/isArray')
const isFunction = require('lodash/isFunction')
const isNumber = require('lodash/isNumber')
const isObject = require('lodash/isObject')
const isUndefined = require('lodash/isUndefined')
const keys = require('lodash/keys')
const map = require('lodash/map')
const reduce = require('lodash/reduce')
const reject = require('lodash/reject')
const replace = require('lodash/replace')
const trim = require('lodash/trim')
const moment = require('moment')


const _e = module.exports

// https://stackoverflow.com/a/27093173/39396
_e.minDate = () => new Date(-8640000000000000)

_e.zeroDate = () => new Date(0)

_e.isTruthy = (val) => !!val

_e.isFalsey = (val) => !val

_e.assert = (test, message) => {
  if (process.env.DO_ASSERT === 'true') {
    const makeMessage = message =>
      // If there is a message thunk, use it
      isFunction(message) ?
        message() :
        // Otherwise if there is a message, use it
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

// Reference for these interesting operand names
// https://math.stackexchange.com/a/1736991/116432
_e.momentAdd = (momentInstance, summand) => {
  const result = momentInstance.clone()
  // add mutates the instance, so we must clone first
  result.add(summand)
  return result
}
_e.momentSubtract = (momentInstance, subtrahend) => {
  const result = momentInstance.clone()
  // add mutates the instance, so we must clone first
  result.subtract(subtrahend)
  return result
}

_e.timestampFormatString = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

_e.utcTimestamp = () => _e.utcNow().format(_e.timestampFormatString)

_e.arrayToObject = (items, itemKey=null) => reduce(items, (acc, item) => {
  if (itemKey) {
    acc[item[itemKey]] = item
  } else {
    acc[item] = item
  }
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

  array.splice(index, 0, item)
  return array
}

_e.insertAllAt = (array, index, items) => {
  if (!isArray(array)) {
    throw new Error('first argument must be an array; was: ' + typeof(array))
  }
  if (!isNumber(index)) {
    throw new Error('second argument must be number; was: ' + typeof(index))
  }
  if (!isArray(items)) {
    throw new Error('third argument must be an array; was: ' + typeof(items))
  }

  const args = [index, 0].concat(items)
  Array.prototype.splice.apply(array, args)
  return array
}

_e.removeAt = (array, index) => {
  array.splice(index, 1)
  return array
}

_e.encodeQueryStringObject = (obj) => map(obj, (val, key) => `${key}=${val}`).join(',')

_e.decodeQueryStringObject = (param) => {
  if (!param) {
    return param
  }

  const keyVals = param.split(',')

  const obj = {}
  forEach(keyVals, (keyVal) => {
    const [key, val] = keyVal.split('=')
    obj[key] = val
  })

  return obj
}

_e.encodeSorts = (sorts) => map(sorts, ({property, direction}) => `${property}=${direction}`).join(',')

_e.decodeSorts = (param) => {
  if (!param) {
    return param
  }

  const propertyDirections = param.split(',')

  const sorts = []
  forEach(propertyDirections, (propertyDirection) => {
    const [property, direction] = propertyDirection.split('=')
    sorts.push({property, direction})
  })

  return sorts
}

/** Removes linebreaks from a string, ensuring whitespace between the joined characters */
_e.toSingleLine = (val) => val.replace(/(\s*)[\r\n]+(\s*)/, (match, leadingWhitespace, trailingWhitespace) => {
  return leadingWhitespace.length === 0 && trailingWhitespace.length === 0 ?
    // If the linebreak(s) have no whitespace around them, then insert some
    ' ' :
    // Otherwise just use the existing whitespace
    ''
})

_e.cleanWhitespace = text => {
  text = trim(text)
  text = replace(text, /\s+/g, ' ')
  return text
}

_e.toSlug = text => text && text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()

_e.omitDeep = function omitDeep(value, predicate = (val) => !val) {
  return cloneDeepWith(value, makeOmittingCloneDeepCustomizer(predicate))
}

function makeOmittingCloneDeepCustomizer(predicate) {
  return function omittingCloneDeepCustomizer(value) {
    if (isObject(value)) {
      if (isArray(value)) {
        let result = reject(value, predicate)
        result = map(result, (item) => cloneDeepWith(item, omittingCloneDeepCustomizer))
        return result
      }

      const clone = {}
      for (const subKey of Object.keys(value)) {
        if (!predicate(value[subKey])) {
          clone[subKey] = cloneDeepWith(value[subKey], omittingCloneDeepCustomizer)
        }
      }
      return clone
    }

    return undefined
  }
}

_e.keysTo = (collection, val) => reduce(
  keys(collection),
  (acc, name) => {
    acc[name] = val
    return acc
  },
  {}
)

_e.toJson = function toJson(val) {
  return JSON.stringify(val)
}

_e.fromJson = function fromJson(json) {
  return JSON.parse(json)
}
