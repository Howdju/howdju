process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const concat = require('lodash/concat')
const get = require('lodash/get')
const has = require('lodash/has')
const isArray = require('lodash/isArray')
const join = require('lodash/join')
const reduce = require('lodash/reduce')
const toLower = require('lodash/toLower')
const uuid = require('uuid')

const env = require('node-env-file')
// ENV vars for either sensitive information or things that may need to be changed via the AWS lambda console
env(__dirname + '/.env')

const {routeEvent} = require('./route')
// config for settings that can be unencrypted at rest and that wait for a deploy to change
const config = require('./config')
const {rewriterContext, logger} = require('./logger')
const {apiHost} = require('./util')
const httpStatusCodes = require('./httpStatusCodes')
const customHeaderKeys = require('./customHeaderKeys')
const headerKeys = require('./headerKeys')

const makeObj = (iterable) => reduce(iterable, (acc, o) => {
  acc[o] = o
  return acc
}, {})

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
  return JSON.parse(event.body)
}

const configureContext = (context) => {
  // Otherwise the pg.Pool timeout keeps us alive
  context.callbackWaitsForEmptyEventLoop = false
}

const makeResponder = (event, callback) => ({httpStatusCode, headers, body}) => {
  const origin = getHeaderValue(event.headers, headerKeys.ORIGIN)
  const response = makeResponse({httpStatusCode, headers, body, origin})
  return callback(null, response)
}

const configureLogger = (clientRequestId, serverRequestId) => {
  rewriterContext.meta = {
    clientRequestId,
    serverRequestId
  }
}

const requestIds = (event) => {
  const clientRequestId = getHeaderValue(event.headers, customHeaderKeys.REQUEST_ID)
  const serverRequestId = uuid.v4()
  return {
    clientRequestId,
    serverRequestId,
  }
}

exports.handler = (event, context, callback) => {
  try {
    logger.silly({event, context})
    logger.silly('Event:', JSON.stringify(event, null, 2))
    logger.silly('Context:', JSON.stringify(context, null, 2))

    configureContext(context)
    const {
      clientRequestId,
      serverRequestId
    } = requestIds(event)
    configureLogger(clientRequestId, serverRequestId)

    const respond = makeResponder(event, callback)

    routeEvent({
      callback: respond,
      request: {
        authToken: extractAuthToken(event),
        clientRequestId,
        serverRequestId,
        clientIdentifiers: {
          sessionStorageId: getHeaderValue(event.headers, customHeaderKeys.SESSION_STORAGE_ID),
          pageLoadId: getHeaderValue(event.headers, customHeaderKeys.PAGE_LOAD_ID),
        },
        // TODO strip out leading /v1/ as {version: 'v1'}
        path: event.pathParameters.proxy,
        method: event.httpMethod,
        queryStringParameters: event.queryStringParameters,
        body: parseBody(event),
      },
    }).then(null, error => {
      logger.error('uncaught error after routeEvent')
      callback(error)
    })
  } catch(error) {
    logger.error(error)
    logger.error('Event:', JSON.stringify(event, null, 2))
    logger.error('Context:', JSON.stringify(context, null, 2))
    callback(error)
  }
}
