process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const assign = require('lodash/assign')
const concat = require('lodash/concat')
const get = require('lodash/get')
const has = require('lodash/has')
const isArray = require('lodash/isArray')
const join = require('lodash/join')
const pick = require('lodash/pick')
const reduce = require('lodash/reduce')
const toLower = require('lodash/toLower')
const uuid = require('uuid')

const env = require('node-env-file')
// ENV vars for either sensitive information or things that may need to be changed via the AWS lambda console
env(__dirname + '/.env')

const {configureGatewayContext} = require('howdju-service-common')

const {routeEvent} = require('./route')
// config for settings that can be unencrypted at rest and that wait for a deploy to change
const config = require('./config')
const {logger} = require('./logging')
const {apiHost} = require('./util')
const httpStatusCodes = require('./httpStatusCodes')
const customHeaderKeys = require('./customHeaderKeys')
const headerKeys = require('./headerKeys')

const makeObj = (iterable) => reduce(iterable, (acc, o) => {
  acc[o] = o
  return acc
}, {})

let previousLogLevel = null

const allowedOrigins = isArray(config.corsAllowOrigin) ? makeObj(config.corsAllowOrigin) : makeObj([config.corsAllowOrigin])
const allowedHeaders = concat([
  headerKeys.CONTENT_TYPE,
  headerKeys.AUTHORIZATION,
], customHeaderKeys.identifierKeys)

const makeResponse = ({httpStatusCode, headers={}, body, origin}) => {
  headers = Object.assign({}, headers, {
    'Access-Control-Allow-Origin': allowedOrigins[origin] || 'none',
    'Access-Control-Allow-Headers': join(allowedHeaders, ','),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Expires': '0',
    'Pragma': 'no-cache',
    'Vary': headerKeys.ORIGIN,
  })
  if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
    // https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
    // realm=<realm> A description of the protected area. If no realm is specified, clients often display a formatted hostname instead.
    headers[headerKeys.WWW_AUTHENTICATE] = `Bearer realm=${apiHost()}`
  }

  const response = {
    statusCode: httpStatusCode || httpStatusCodes.ERROR,
    headers,
  }

  if (body) {
    if (httpStatusCode === httpStatusCodes.NO_CONTENT) {
      logger.warn('noContent response received body.  Ignoring')
    } else {
      response.headers['Content-Type'] = 'application/json'
      response['body'] = JSON.stringify(body)
    }
  }

  return response
}

const getHeaderValue = (headers, headerName) => {
  let headerValue = get(headers, headerName)
  if (!headerValue) {
    const lowerHeaderName = toLower(headerName)
    if (lowerHeaderName !== headerName) {
      headerValue = get(headers, lowerHeaderName)
    }
  }
  return headerValue
}

const authorizationHeaderPrefix = 'Bearer '
const extractAuthToken = event => {
  const authorizationHeader = getHeaderValue(event.headers, headerKeys.AUTHORIZATION)
  if (!authorizationHeader) {
    return null
  }
  if (!authorizationHeader.startsWith(authorizationHeaderPrefix)) {
    logger.warn(`Invalid authorization header: ${authorizationHeader}`)
    return null
  }
  return authorizationHeader.substring(authorizationHeaderPrefix.length)
}

const parseBody = event => {
  // TODO throw error if cant' support content-type.  handle application/form?
  // example: 'content-type':'application/json;charset=UTF-8',
  const body = event.body
  if (!body) {
    return null
  }
  try {
    return JSON.parse(body)
  } catch (err) {
    logger.error(`Error parsing JSON body (${body})`, err)
    return null
  }
}

const makeResponder = (gatewayEvent, gatewayCallback) => ({httpStatusCode, headers, body}) => {
  const origin = getHeaderValue(gatewayEvent.headers, headerKeys.ORIGIN)
  const response = makeResponse({httpStatusCode, headers, body, origin})
  return gatewayCallback(null, response)
}

const configureLogger = (gatewayEvent, gatewayContext, requestIdentifiers) => {
  if (gatewayContext.isLocal) {
    logger.doUseCarriageReturns = false
  }

  const logLevel = get(gatewayEvent, ['stageVariables', 'logLevel'])
  if (logLevel) {
    previousLogLevel = logger.logLevel
    logger.logLevel = logLevel
    logger.silly(`Setting logger to stage logLevel ${logLevel} (was ${previousLogLevel})`)
  }

  const loggingContext = pick(requestIdentifiers, ['clientRequestId', 'serverRequestId'])
  const stage = get(gatewayEvent, ['requestContext', 'stage'])
  if (stage) {
    loggingContext.stage = stage
  }
  logger.context = loggingContext
}

const makeRequestIdentifiers = (gatewayEvent, gatewayContext) => {
  const requestIdentifiers = {}
  const clientRequestId = getHeaderValue(gatewayEvent.headers, customHeaderKeys.REQUEST_ID)
  if (clientRequestId) {
    requestIdentifiers.clientRequestId = clientRequestId
  }
  // We only need one identifier generated server-side; if AWS provides one, use it
  if (gatewayContext.awsRequestId) {
    requestIdentifiers.awsRequestId = gatewayContext.awsRequestId
  } else {
    requestIdentifiers.serverRequestId = uuid.v4()
  }
  return requestIdentifiers
}

const makeRequest = (gatewayEvent, gatewayCallback, requestIdentifiers) => {
  const respond = makeResponder(gatewayEvent, gatewayCallback)
  return {
    callback: respond,
    request: {
      authToken: extractAuthToken(gatewayEvent),
      requestIdentifiers,
      clientIdentifiers: {
        sessionStorageId: getHeaderValue(gatewayEvent.headers, customHeaderKeys.SESSION_STORAGE_ID),
        pageLoadId: getHeaderValue(gatewayEvent.headers, customHeaderKeys.PAGE_LOAD_ID),
      },
      // TODO strip out leading /v1/ as {version: 'v1'}
      path: gatewayEvent.pathParameters.proxy,
      method: gatewayEvent.httpMethod,
      queryStringParameters: gatewayEvent.queryStringParameters,
      body: parseBody(gatewayEvent),
    },
  }
}

exports.handler = (gatewayEvent, gatewayContext, gatewayCallback) => {
  try {
    configureGatewayContext(gatewayContext)
    const requestIdentifiers = makeRequestIdentifiers(gatewayEvent, gatewayContext)
    configureLogger(gatewayEvent, gatewayContext, requestIdentifiers)

    logger.silly('gatewayEvent:', gatewayEvent)
    logger.silly('gatewayContext:', gatewayContext)

    const request = makeRequest(gatewayEvent, gatewayCallback, requestIdentifiers)
    routeEvent(request).then(null, error => {
      logger.error('uncaught error after routeEvent')
      gatewayCallback(error)
    })
  } catch(error) {
    logger.error(error)
    logger.error('gatewayEvent:', gatewayEvent)
    logger.error('gatewayContext:', gatewayContext)
    gatewayCallback(error)
  } finally {
    // I'm not sure if stages can share lambda function instances, but if they can, then we can't overwrite the log level without returning it
    // Possibly we can't even safely change the log level globally, if it is possible for stages to share instances mid-request
    // In that case we'd need to keep a logger per stage, or per logLevel, or pool loggers and pass them along with the requests
    if (previousLogLevel) {
      logger.silly(`Returning logger to previous logLevel ${previousLogLevel} (is ${logger.logLevel})`)
      logger.logLevel = previousLogLevel
      previousLogLevel = null
    }
  }
}
