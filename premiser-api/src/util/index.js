const isFunction = require('lodash/isFunction')
const set = require('lodash/set')

function assert(test, message) {
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

  const logError = message => console.error("Failed assertion: " + makeMessage(message))

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

const logError = (error) => {
  console.error(error)
}

const rethrowTranslatedErrors = translationKey => error => {
  const errors = {}
  set(errors, translationKey, error.errors)
  error.errors = errors
  throw error
}

const isTruthy = val => !!val



module.exports = {
  assert,
  logError,
  rethrowTranslatedErrors,
  isTruthy,
}

