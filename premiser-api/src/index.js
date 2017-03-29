process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

const Promise = require('bluebird')
const pg = require('pg')

const config = {
  user: process.env['DB_USER'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] || 5432,
  max: process.env['DB_POOL_MAX_CLIENTS'] || 10,
  idleTimeoutMillis: process.env['DB_CLIENT_TIMEOUT'] || 3000,
}

const pool = new pg.Pool(config)
// pool.end()

pool.on('error', (err, client) => console.error('idle client error', err.message, err.stack))

const statusCodes = {
  ok: 200,
  notFound: 404,
  error: 500
}

function respond({status, headers, body, callback}) {
  const response = {
    statusCode: statusCodes[status] || statusCodes.error,
    headers,
    body: JSON.stringify(body)
  }
  callback(null, response);
}

const ok = ({body, callback}) => respond({status: 'ok', body, callback})
const notImplemented = callback => respond({status: 'error', body: 'not implemented', callback})
const notFound = callback => respond({status: 'notFound', body: 'not found', callback})

const query = query => Promise.resolve(
    pool.connect().then(client => client.query(query).finally(() => client.release()))
)
const queries = queries => Promise.resolve(
    pool.connect().then(client => Promise
        .all(queries.map(q => client.query.apply(client, q)))
        .finally(() => client.release()))
)

const routes = [
  {
    path: 'statements',
    method: 'GET',
    handler: ({callback}) => query('select * from statements')
        .then(result => {
          console.log(`Returning ${result.rows.length} statements`)
          ok({body: result.rows, callback})
        })
        .error(error => { throw error })
  },
  {
    path: 'statements',
    method: 'PUT',
    handler: notImplemented
  },
  {
    path: new RegExp('^statements/([^/]+)$'),
    method: 'GET',
    handler: ({callback, pathParameters: [statementId]}) => queries([
          ['select * from statements where statement_id = $1', [statementId]],
          ['select * from justifications where target_type = $1 AND target_id = $2', ['STATEMENT', statementId]],
        ])
        .then(([{rows: [statement]}, {rows: justifications}]) => {
          if (!statement) {
            notFound(callback)
          } else {
            console.log(`Returning statement ${statement.id} with ${justifications.length} justifications`)
            ok({body: {statement, justifications}, callback})
          }
        })
        .error(error => { throw error })
  }
]

function selectRoute({path, method, queryParameters}) {
  let match = null;
  debugger
  for (let route of routes) {
    if (typeof route.path === 'string' &&
        route.path === path &&
        route.method === method
    ) {
      return {route}
    } else if (route.path instanceof RegExp &&
        (match = route.path.exec(path))
    ) {
      // First item is the whole match
      const pathParameters = match.slice(1)
      return {route, pathParameters}
    }
  }

  return {route: null};
}

function routeEvent({path, method, queryParameters}, callback) {
  const {route, pathParameters} = selectRoute({path, method, queryParameters})
  if (route) {
    route.handler({callback, pathParameters, queryParameters})
  } else {
    notFound(callback)
  }
}

exports.handler = (event, context, callback) => {
  try {
    routeEvent({
      path: event.pathParameters.proxy,
      method: event.httpMethod,
      parameters: event.queryStringParameters
    }, callback);
  } catch(error) {
    console.error('Received event:', JSON.stringify(event, null, 2))
    console.error('Received context:', JSON.stringify(context, null, 2))
    callback(error)
  }
}