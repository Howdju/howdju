const forEach = require('lodash/forEach')

const {
  newArgumentsError
} = require('./commonErrors')
const {
  isDefined
} = require('./general')

const _e = module.exports

_e.requireArgs = (requiredArgs) => {
  const missing = []
  forEach(requiredArgs, (value, name) => {
    if (!isDefined(value)) {
      missing.push(name)
    }
  })

  if (missing.length > 0) {
    throw newArgumentsError(`Required arguments are undefined: ${missing.join(', ')}`)
  }
  return true
}