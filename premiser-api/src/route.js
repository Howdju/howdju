const Promise = require('bluebird')
const merge = require('lodash/merge')

const {statements, statementJustifications, login, logout, createUser} = require('./service')

const ok = ({callback, body={}, headers}) => callback({
  status: 'ok',
  headers,
  body
})
const notImplemented = callback => callback({
  status: 'error',
  body: {message: 'not implemented'}
})
const notFound = ({callback, message='not found'}) => callback({
  status: 'notFound',
  body: {message}
})
const forbidden = ({callback, message='forbidden'}) => callback({
  status: 'forbidden',
  body: {message}
})
const badRequest = ({callback, message='bad request'}) => callback({
  status: 'badRequest',
  body: {message}
})

const GET = 'GET'
const POST = 'POST'
const PUT = 'PUT'
const OPTIONS = 'OPTIONS'

const routes = [
  {
    method: OPTIONS,
    handler: ({callback}) => {
      const headers = {
        'Access-Control-Allow-Headers': 'Content-Type'
      }
      return ok({headers, callback})
    }
  },
  {
    path: 'statements',
    method: GET,
    handler: ({callback}) => statements()
        .then(statements => {
          console.log(`Returning ${statements.length} statements`)
          return ok({callback, body: statements})
        })
  },
  {
    path: 'statements',
    method: POST,
    handler: notImplemented
  },
  {
    path: new RegExp('^statements/([^/]+)$'),
    method: 'GET',
    handler: ({callback, request: {pathParameters: [statementId]}}) => statementJustifications(statementId)
        .then(({statement, justifications}) => {
          if (!statement) {
            return notFound({callback})
          } else {
            console.log(`Returning statement ${statement.id} with ${justifications.length} justifications`)
            return ok({callback, body: {statement, justifications}})
          }
        })
  },
  {
    path: 'login',
    method: POST,
    handler: ({callback, request: {body}}) => login(body)
        .then(({message, isInvalid, isNotFound, isNotAuthorized, auth}) => {
          if (isInvalid) {
            return badRequest({callback, message})
          }
          if (isNotFound) {
            return notFound({callback, message})
          }
          if (isNotAuthorized) {
            return forbidden({callback, message})
          }
          console.log(`Successfully authenticated ${auth.email}`)
          return ok({callback, body: auth})
        })
  },
  {
    path: 'logout',
    method: POST,
    handler: ({callback, request: authenticationToken}) => logout({authenticationToken})
        .then( () => ok({callback}) )
  },
  {
    path: 'users',
    method: POST,
    handler: ({callback, request: {body: {credentials: {email, password}, authenticationToken}}}) => createUser(body)
        .then(({message, notAuthorized, user}) => {
          if (notAuthorized) {
            return forbidden({callback, message})
          } else {
            console.log(`Successfully created user ${user.id}`)
            return ok({callback, body: {user}})
          }
        })
  },
]

function selectRoute({path, method, queryStringParameters}) {
  let match;
  for (let route of routes) {
    if (!route.path && route.method === method) {
      return Promise.resolve({route})
    }
    if (typeof route.path === 'string' &&
        route.path === path &&
        route.method === method
    ) {
      return Promise.resolve({route})
    }
    if (route.path instanceof RegExp &&
        (match = route.path.exec(path))
    ) {
      // First item is the whole match
      const pathParameters = match.slice(1)
      return Promise.resolve({route, pathParameters})
    }
  }

  return Promise.resolve({route: null})
}

exports.routeEvent = ({callback, request}) =>
  selectRoute(request)
      .then( ({route, pathParameters}) => route ?
          route.handler({callback, request: merge({}, request, {pathParameters})}) :
          notFound({callback})
      )