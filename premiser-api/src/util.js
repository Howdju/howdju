const dns = require('dns')
const os = require('os')
const deasync = require('deasync')
const isFunction = require('lodash/isFunction')
const {logger} = require('./logger')

exports.isTruthy = val => !!val

exports.assert = (test, message) => {
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

exports.apiHost = () => {
  let apiHost = process.env['API_HOST']
  if (apiHost) {
    return apiHost
  }
  return exports.hostAddress()
}

exports.devWebServerPort = () => {
  return process.env['DEV_WEB_SERVER_PORT'] || 3000
}

exports.hostAddress = () => {
  let address = null;
  let done = false
  dns.lookup(os.hostname(), function (err, add, fam) {
    address = add
    done = true
  })
  deasync.loopWhile(() => !done)
  return address
}

exports.devApiServerPort = () => {
  return process.env['DEV_API_SERVER_PORT'] || 8081
}
