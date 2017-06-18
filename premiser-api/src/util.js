const _ = require('lodash')

function assert(test, message) {
  const makeMessage = message =>
      // If there is a message thunk, use it
      _.isFunction(message) ?
          message() :
          // Otherwise if there is a message, us it
          !!message ?
              message :
              // Otherwise, if the test was a thunk, use it as a description
              _.isFunction(test) ?
                  test.toString().substring(0, 1024) :
                  // Otherwise, not much else we can do
                  message

  const logError = message => console.error("Failed assertion: " + makeMessage(message))

  if (process.env.DO_ASSERT === 'true') {
    if (_.isFunction(test)) {
      if (!test()) {
        logError(message)
      }
    } else if (!test) {
      logError(message)
    }
  }
}

const logError = (error) => {
  console.error(error)
}

const rethrowTranslatedValidationError = translationKey => e => {
  e.errors = {[translationKey]: e.errors}
  throw e
}

module.exports = {
  assert,
  logError,
  rethrowTranslatedValidationError,
}