process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const _ = require('lodash')
const env = require('node-env-file')
// ENV vars for either sensitive information or things that may need to be changed via the AWS lambda console
env(__dirname + '/.env')

const {routeEvent} = require('./route')
// config for settings that can be unencrypted at rest and that wait for a deploy to change
const config = require('./config')
const {logger} = require('./logger')

/** See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *  See https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 */
const statusCodes = {
  ok: 200,
  /** There was nothing to do and nothing new to return (does not allow a body) */
  noContent: 204,
  /** The parameters/body supplied for the endpoint are improper */
  badRequest: 400,
  /** The user is not authenticated, or improperly authenticated */
  unauthorized: 401,
  /** The user is authenticated, but lacks permission */
  forbidden: 403,
  notFound: 404,
  /** The request would conflict with one or more other entities
   * (e.g. a user tries to update one statement's text to a value equal to another statement's text)
   */
  entityConflict: 462,
  /** The request would conflict with one or more other users' actions
   * (e.g. a user tries to edit a statement after other users have added justifications to it)
   */
  userActionsConflict: 463,
  error: 500,
}

const makeObj = (iterable) => _.reduce(iterable, (acc, o) => {
  acc[o] = o
  return acc
}, {})

const allowedOrigins = _.isArray(config.corsAllowOrigin) ? makeObj(config.corsAllowOrigin) : makeObj([config.corsAllowOrigin])

const makeResponse = ({status, headers={}, body, origin}) => {
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
  if (status === 'unauthorized') {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
    // https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml
    // realm=<realm> A description of the protected area. If no realm is specified, clients often display a formatted hostname instead.
    headers['WWW-Authenticate'] = `Bearer realm=${process.env['API_HOST']}`
  }

  const response = {
    statusCode: statusCodes[status] || statusCodes.error,
    headers,
  }

  if (body) {
    if (status === 'noContent') {
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

exports.handler = (event, context, callback) => {
  try {
    // Otherwise the pg.Pool timeout keeps us alive
    context.callbackWaitsForEmptyEventLoop = false

    function respond({status, headers, body}) {
      const response = makeResponse({status, headers, body, origin: event.headers.origin})
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
        body: event.body,
      },
    }).then(null, error => callback(error))
  } catch(error) {
    logger.error(error)
    console.error('Event:', JSON.stringify(event, null, 2))
    console.error('Context:', JSON.stringify(context, null, 2))
    callback(error)
  }
}
