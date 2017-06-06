const Promise = require('bluebird')
const merge = require('lodash/merge')
const assign = require('lodash/assign')
const isEqual = require('lodash/isEqual')
const httpMethods = require('./httpMethods')

const {
  ENTITY_CONFLICT_RESPONSE_CODE,
  USER_ACTIONS_CONFLICT_RESPONSE_CODE,
} = require("./codes/responseCodes");
const {
  AuthenticationError,
  AuthorizationError,
  ImpossibleError,
  NotFoundError,
  EntityConflictError,
  UserActionsConflictError,
} = require("./errors")
const {
  statements,
  readStatement,
  readStatementJustifications,
  login,
  logout,
  createUser,
  vote,
  unvote,
  createStatement,
  updateStatement,
  deleteStatement,
  createJustification,
  deleteJustification,
  readCitationReference,
  updateCitationReference,
} = require('./service')
const {
  searchStatements,
} = require('./search')
const {logger} = require('./logger')

const ok = ({callback, body={}, headers}) => callback({
  status: 'ok',
  headers,
  body
})
const noContent = args => {
  // NO CONTENT must not have a body. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204
  if (args.body) logger.error('noContent may not return a body.  Ignoring body')
  return args.callback({status: 'noContent'})
}
const notImplemented = ({callback}) => callback({
  status: 'error',
  body: {message: 'not implemented'}
})
const notFound = ({callback, message='not found'}) => callback({
  status: 'notFound',
  body: {message}
})
const unauthenticated = ({callback}) => callback({
  status: 'unauthorized',
})
const unauthorized = ({callback}) => callback({
  status: 'forbidden',
})
const badRequest = ({callback, message='bad request'}) => callback({
  status: 'badRequest',
  body: {message}
})
const error = ({callback, body={}}) => callback({
  status: 'error',
  body
})
const entityConflict = ({callback, conflictCodes}) => callback({
  status: 'error',
  body: {
    responseCode: ENTITY_CONFLICT_RESPONSE_CODE,
    payload: {
      conflictCodes
    }
  }
})
const userActionsConflict = ({callback}) => callback({
  status: 'error',
  body: {
    responseCode: USER_ACTIONS_CONFLICT_RESPONSE_CODE
  }
})

const routes = [
  {
    method: httpMethods.OPTIONS,
    handler: ({callback}) => {
      const headers = {
        'Access-Control-Allow-Headers': 'Content-Type'
      }
      return Promise.resolve(ok({headers, callback}))
    }
  },
  {
    path: 'statements',
    method: httpMethods.GET,
    handler: ({callback}) => statements()
        .then(statements => {
          logger.debug(`Returning ${statements.length} statements`)
          return ok({callback, body: statements})
        })
  },
  {
    id: 'searchStatements',
    path: 'search-statements',
    method: httpMethods.GET,
    handler: ({callback, request: { queryStringParameters: { searchText }}}) => searchStatements(searchText)
        .then(rankedStatements => {
          logger.debug(`Returning ${rankedStatements.length} statements from search`)
          return ok({callback, body: rankedStatements})
        })
  },
  {
    id: 'createStatement',
    path: 'statements',
    method: httpMethods.POST,
    handler: ({
                callback,
                request: {
                  authToken,
                  body: {statement, justification},
                  method,
                  path
                }
    }) => createStatement({authToken, statement, justification})
        .then( ({isUnauthenticated, isInvalid, statement, justification, isExtant}) => {
          if (isUnauthenticated) {
            return unauthenticated({callback})
          } else if (isInvalid) {
            return badRequest({callback})
          } else if (statement) {
            return ok({callback, body: {statement, justification, isExtant}})
          }
          logger.error(`It shouldn't be possible for ${method} ${path} to get here.`)
          return error({callback})
        })
  },
  {
    id: 'updateStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.PUT,
    handler: ({
                callback,
                request: {
                  authToken,
                  body: {statement},
                }
              }) => updateStatement({authToken, statement})
        .then( (statement) => ok({callback, body: {statement}}))
  },
  {
    id: 'readStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: ({
                callback,
                request: {
                  pathParameters: [statementId],
                  authToken,
                }
              }) => readStatement({statementId, authToken})
        .then( ({statement}) => ok({callback, body: {statement}}))
  },
  {
    id: 'readStatementJustifications',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {
      include: 'justifications'
    },
    handler: ({
                callback,
                request: {
                  pathParameters: [statementId],
                  authToken,
                  // TODO look at include=justifications query param
                  queryStringParameters
                }
              }) => readStatementJustifications({statementId, authToken})
        .then(({statement, justifications}) => {
          if (!statement) {
            return notFound({callback})
          } else {
            logger.debug(`Returning statement ${statement.id} with ${justifications.length} justifications`)
            return ok({callback, body: {statement, justifications}})
          }
        })
  },
  {
    id: 'deleteStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: ({
                callback,
                request: {
                  authToken,
                  method,
                  path,
                  pathParameters: [statementId],
                }
    }) => deleteStatement({authToken, statementId}).then(({isUnauthenticated, isUnauthorized, isSuccess}) => {
      if (isUnauthenticated) {
        return unauthenticated({callback})
      } else if (isUnauthorized) {
        return unauthorized({callback})
      } else if (isSuccess) {
        return ok({callback})
      }
      logger.error(`It shouldn't be possible for ${method} ${path} to get here.`)
      return error({callback})
    })
  },
  {
    id: 'createJustification',
    path: 'justifications',
    method: httpMethods.POST,
    handler: ({
                callback,
                request: {
                  authToken,
                  body: {
                    justification
                  },
                  method,
                  path,
                }
    }) => createJustification({authToken, justification})
        .then( ({isUnauthenticated, isInvalid, justification}) => {
          if (isUnauthenticated) {
            return unauthenticated({callback})
          } else if (isInvalid) {
            return badRequest({callback})
          } else if (justification) {
            return ok({callback, body: {justification}})
          }
          logger.error(`It shouldn't be possible for ${method} ${path} to get here.`)
          return error({callback})
        })
  },
  {
    id: 'readCitationReference',
    path: new RegExp('^citation-references/([^/]+)$'),
    method: httpMethods.GET,
    handler: ({
      callback,
      request: {
        authToken,
        pathParameters,
      }
    }) => readCitationReference({authToken, citationReferenceId: pathParameters[0]})
        .then(citationReference => ok({callback, body: {citationReference}}))
  },
  {
    id: 'updateCitationReference',
    path: new RegExp('^citation-references/([^/]+)$'),
    method: httpMethods.PUT,
    handler: ({
        callback,
        request: {
          authToken,
          body: {
            citationReference
          }
        }
    }) => updateCitationReference({authToken, citationReference})
        .then( (updatedCitationReference) => {
          if (updatedCitationReference === citationReference) {
            return noContent({callback})
          }
          return ok({callback, body: {citationReference}})
        })
  },
  {
    id: 'deleteJustification',
    path: new RegExp('^justifications/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: ({
                callback,
                request: {
                  authToken,
                  body: {
                    justification
                  },
                  method,
                  path,
                  pathParameters: [justificationId]
                }
              }) => deleteJustification({authToken, justificationId})
        .then( ({isUnauthenticated, isUnauthorized, isSuccess}) => {
          if (isUnauthenticated) {
            return unauthenticated({callback})
          } else if (isUnauthorized) {
            return unauthorized({callback})
          } else if (isSuccess) {
            return ok({callback})
          }
          logger.error(`It shouldn't be possible for ${method} ${path} to get here.`)
          return error({callback})
        })
  },
  {
    path: 'login',
    method: httpMethods.POST,
    handler: ({callback, request: {body}}) => login(body)
        .then(({message, isInvalid, isNotFound, isNotAuthorized, auth}) => {
          if (isInvalid) {
            return badRequest({callback, message})
          }
          if (isNotFound) {
            return notFound({callback, message})
          }
          if (isNotAuthorized) {
            return unauthorized({callback, message})
          }
          logger.debug(`Successfully authenticated ${auth.email}`)
          return ok({callback, body: auth})
        })
  },
  {
    path: 'logout',
    method: httpMethods.POST,
    handler: ({callback, request: {authToken}}) => logout({authToken})
        .then( () => ok({callback}) )
  },
  {
    path: new RegExp('^votes$'),
    method: httpMethods.POST,
    handler: ({callback, request: {body: {targetType, targetId, polarity}, authToken}}) =>
        vote({authToken, targetType, targetId, polarity})
            .then( ({isUnauthenticated, isAlreadyDone, vote}) => {
              if (isUnauthenticated) {
                return unauthenticated({callback})
              } else if (isAlreadyDone) {
                return ok({callback, body: vote})
              }
              return ok({callback, body: vote})
            })
  },
  {
    path: new RegExp('^votes$'),
    method: httpMethods.DELETE,
    handler: ({callback, request: {body: {targetType, targetId, polarity}, authToken, method, path}}) =>
        // TODO base this on the vote_id instead?  Ensure the vote_id matches up with the other values passed?
        unvote({authToken, targetType, targetId, polarity})
            .then( ({isUnauthenticated, isAlreadyDone, isSuccess}) => {
              if (isUnauthenticated) {
                return unauthenticated({callback})
              } else if (isAlreadyDone) {
                return noContent({callback})
              }
              if (isSuccess) {
                return ok({callback})
              }
              logger.error(`It shouldn't be possible for ${method} ${path} to get here.`)
              return error({callback})
            })
  },
  {
    path: 'users',
    method: httpMethods.POST,
    handler: ({callback, request: {body: {credentials: {email, password}, authToken}}}) => createUser(body)
        .then( ({message, notAuthorized, user}) => {
          if (notAuthorized) {
            return unauthorized({callback, message})
          } else {
            logger.debug(`Successfully created user ${user.id}`)
            return ok({callback, body: {user}})
          }
        })
  },
]

function selectRoute({path, method, queryStringParameters}) {

  for (let route of routes) {
    let match

    if (route.method && route.method !== method) continue
    if (typeof route.path === 'string' && route.path !== path) continue
    if (route.path instanceof RegExp && !(match = route.path.exec(path))) continue
    if (route.queryStringParameters && !isEqual(route.queryStringParameters, queryStringParameters)) continue

    // First item is the whole match, rest are the group matches
    const pathParameters = match ? match.slice(1) : undefined
    return Promise.resolve({route, pathParameters})
  }

  return Promise.reject()
}

const routeEvent = ({callback, request}) =>
  selectRoute(request).then(
    ({route, pathParameters}) => route.handler({callback, request: assign({}, request, {pathParameters})}),
    () => {
      logger.debug(`No route for ${request.method} ${request.path}`)
      return notFound({callback})
    }
  )
      .catch(NotFoundError, e => notFound({callback}))
      .catch(AuthenticationError, e => unauthenticated({callback}))
      .catch(AuthorizationError, e => unauthorized({callback}))
      .catch(EntityConflictError, e => entityConflict({callback, conflicts: e.conflictCodes}))
      .catch(UserActionsConflictError, e => userActionsConflict({callback}))
      .catch(e => {
        logger.error(e)
        return error({callback})
      })

module.exports = {
  routes,
  routeEvent,
  selectRoute,
}