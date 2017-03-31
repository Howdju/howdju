const {statements, statementJustifications} = require('./service')

const ok = ({body, callback}) => callback({status: 'ok', body})
const notImplemented = callback => callback({status: 'error', body: 'not implemented'})
const notFound = callback => callback({status: 'notFound', body: 'not found'})

const routes = [
  {
    path: 'statements',
    method: 'GET',
    handler: ({callback}) => statements()
        .then(statements => {
          console.log(`Returning ${statements.length} statements`)
          ok({body: statements, callback})
        })
  },
  {
    path: 'statements',
    method: 'PUT',
    handler: notImplemented
  },
  {
    path: new RegExp('^statements/([^/]+)$'),
    method: 'GET',
    handler: ({callback, pathParameters: [statementId]}) => statementJustifications(statementId)
        .then(({statement, justifications}) => {
          if (!statement) {
            notFound(callback)
          } else {
            console.log(`Returning statement ${statement.id} with ${justifications.length} justifications`)
            ok({body: {statement, justifications}, callback})
          }
        })
  }
]

function selectRoute({path, method, queryStringParameters}) {
  let match = null;
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

exports.routeEvent = ({path, method, queryStringParameters}, callback) => {
  const {route, pathParameters} = selectRoute({path, method, queryStringParameters})
  if (route) {
    route.handler({callback, pathParameters, queryStringParameters}).error(error => { throw error })
  } else {
    notFound(callback)
  }
}