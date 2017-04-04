export function extractDomain(url) {
  let domain;
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

export function assert(test, message) {
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

export const logError = (error) => {
  console.error(error)
}