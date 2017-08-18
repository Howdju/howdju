process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const reduce = require('lodash/reduce')
const isArray = require('lodash/isArray')
const httpStatusCodes = require('./httpStatusCodes')
const env = require('node-env-file')
// ENV vars for either sensitive information or things that may need to be changed via the AWS lambda console
env(__dirname + '/.env')

const {routeEvent} = require('./route')
// config for settings that can be unencrypted at rest and that wait for a deploy to change
const config = require('./config')
const {logger} = require('./logger')
const {apiHost} = require('./util')

const makeObj = (iterable) => reduce(iterable, (acc, o) => {
  acc[o] = o
  return acc
}, {})

const allowedOrigins = isArray(config.corsAllowOrigin) ? makeObj(config.corsAllowOrigin) : makeObj([config.corsAllowOrigin])

const makeResponse = ({httpStatusCode, headers={}, body, origin}) => {
  headers = Object.assign({}, headers, {
    'Access-Control-Allow-Origin': allowedOrigins[origin] || 'none',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Expires': '0',
    'Pragma': 'no-cache',
    'Vary': 'Origin',
  })
  if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
    // https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
    // realm=<realm> A description of the protected area. If no realm is specified, clients often display a formatted hostname instead.
    headers['WWW-Authenticate'] = `Bearer realm=${apiHost()}`
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

const extractAuthToken = event => {
  const authorizationHeader = event.headers['Authorization'] || event.headers['authorization']
  if (!authorizationHeader) {
    return null
  }
  if (!authorizationHeader.startsWith('Bearer ')) {
    logger.warn(`Invalid authorization header: ${authorizationHeader}`)
    return null
  }
  return authorizationHeader.substring('Bearer '.length)
}

const parseBody = event => {
  // TODO throw error if cant' support content-type.  handle application/form?
  // example: 'content-type':'application/json;charset=UTF-8',
  return JSON.parse(event.body)
}

exports.handler = (event, context, callback) => {
  try {
    // Otherwise the pg.Pool timeout keeps us alive
    context.callbackWaitsForEmptyEventLoop = false

    function respond({httpStatusCode, headers, body}) {
      const response = makeResponse({httpStatusCode, headers, body, origin: event.headers.origin})
      return callback(null, response)
    }

    routeEvent({
      callback: respond,
      request: {
        authToken: extractAuthToken(event),
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
    console.error('Event:', JSON.stringify(event, null, 2))
    console.error('Context:', JSON.stringify(context, null, 2))
    callback(error)
  }
}
