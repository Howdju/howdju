process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const _ = require('lodash')
const env = require('node-env-file')
env(__dirname + '/.env')

const {routeEvent} = require('./route')
const config = require('./config')

const statusCodes = {
  ok: 200,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Expires': '0',
    'Pragma': 'no-cache',
    'Vary': 'Origin',
  })

  return {
    statusCode: statusCodes[status] || statusCodes.error,
    headers,
    body: JSON.stringify(body)
  }

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
      path: event.pathParameters.proxy,
      method: event.httpMethod,
      queryStringParameters: event.queryStringParameters,
      body: event.body,
    }, respond)
        .error(error => callback(error))
  } catch(error) {
    console.error('Event:', JSON.stringify(event, null, 2))
    console.error('Context:', JSON.stringify(context, null, 2))
    callback(error)
  }
}
