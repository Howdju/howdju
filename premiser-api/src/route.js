const Promise = require('bluebird')
const merge = require('lodash/merge')
const assign = require('lodash/assign')
const isEqual = require('lodash/isEqual')
const httpMethods = require('./httpMethods')
const httpStatusCodes = require('./httpStatusCodes')

const {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  EntityConflictError,
  UserActionsConflictError,
  ValidationError,
} = require("./errors")
const apiErrorCodes = require('./codes/apiErrorCodes')
const {
  readStatements,
  readStatement,
  readStatementJustifications,
  login,
  logout,
  createUser,
  createVote,
  deleteVote,
  createStatement,
  createStatementJustification,
  updateStatement,
  deleteStatement,
  createJustification,
  deleteJustification,
  readCitationReference,
  updateCitationReference,
} = require('./service')
const {
  searchStatements,
} = require('./search/statements')
const {
  searchCitations,
} = require('./search/citations')
const {logger} = require('./logger')

const ok = ({callback, body={}, headers}) => callback({
  httpStatusCode: httpStatusCodes.OK,
  headers,
  body
})
const noContent = args => {
  // NO CONTENT must not have a body. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204
  if (args.body) logger.error('noContent may not return a body.  Ignoring body')
  return args.callback({
    httpStatusCode: httpStatusCodes.NO_CONTENT
  })
}
const notFound = ({callback, body={errorCode: apiErrorCodes.NOT_FOUND} }) => callback({
  httpStatusCode: httpStatusCodes.NOT_FOUND,
  body
})
const unauthenticated = ({callback, body={errorCode: apiErrorCodes.UNAUTHENTICATED} }) => callback({
  httpStatusCode: httpStatusCodes.UNAUTHORIZED,
  body
})
const unauthorized = ({callback, body}) => callback({
  httpStatusCode: httpStatusCodes.FORBIDDEN,
  body,
})
const badRequest = ({callback, body}) => callback({
  httpStatusCode: httpStatusCodes.BAD_REQUEST,
  body
})
const error = ({callback, body}) => callback({
  httpStatusCode: httpStatusCodes.ERROR,
  body
})

const routes = [
  {
    method: httpMethods.OPTIONS,
    handler: ({callback}) => {
      const headers = {
        'Access-Control-Allow-Headers': 'Content-Type'
      }
      return ok({headers, callback})
    }
  },
  {
    id: 'readStatements',
    path: 'statements',
    method: httpMethods.GET,
    handler: ({callback}) => readStatements()
        .then(statements => ok({callback, body: {statements}}))
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
    id: 'searchCitations',
    path: 'search-citations',
    method: httpMethods.GET,
    handler: ({callback, request: { queryStringParameters: { searchText }}}) => searchCitations(searchText)
        .then(rankedStatements => {
          logger.debug(`Returning ${rankedStatements.length} citations from search`)
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
                  body: {statement},
                  method,
                  path
                }
    }) => createStatement({authToken, statement})
        .then( ({statement, isExtant}) => ok({callback, body: {statement, isExtant}}))
  },
  {
    id: 'createStatementJustification',
    path: 'statement-justifications',
    method: httpMethods.POST,
    handler: ({
                callback,
                request: {
                  authToken,
                  body: {statementJustification},
                  method,
                  path
                }
              }) => createStatementJustification({authToken, statementJustification})
        .then( ({statementJustification, isStatementExtant, isJustificationExtant}) =>
            ok({callback, body: {statementJustification, isStatementExtant, isJustificationExtant}})
        )
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
                  queryStringParameters
                }
              }) => readStatementJustifications({statementId, authToken})
        .then( ({statement, justifications}) => ok({callback, body: {statement, justifications}}) )
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
    }) => deleteStatement({authToken, statementId}).then( () => ok({callback}) )
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
        .then( ({justification}) => ok({callback, body: {justification}}))
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
          return ok({callback, body: {citationReference: updatedCitationReference}})
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
              }) => deleteJustification({authToken, justificationId}).then( () => ok({callback}) )
  },
  {
    path: 'login',
    method: httpMethods.POST,
    // TODO change to body: {credentials}
    handler: ({callback, request: {body}}) => login(body)
        .then(({auth}) => ok({callback, body: auth}))
  },
  {
    path: 'logout',
    method: httpMethods.POST,
    handler: ({callback, request: {authToken}}) => logout({authToken}).then( () => ok({callback}) )
  },
  {
    id: 'createVote',
    path: new RegExp('^votes$'),
    method: httpMethods.POST,
    handler: ({callback, request: {body: {vote}, authToken}}) =>
        createVote({authToken, vote})
            .then(vote => ok({callback, body: {vote}}))
  },
  {
    id: 'deleteVote',
    path: new RegExp('^votes$'),
    method: httpMethods.DELETE,
    handler: ({callback, request: {body: {vote}, authToken, method, path}}) =>
        deleteVote({authToken, vote})
            .then( () => ok({callback}) )
  },
  {
    id: 'createUser',
    path: 'users',
    method: httpMethods.POST,
    handler: ({callback, request: {body: {credentials: {email, password}, authToken}}}) => createUser(body)
        .then( ({user}) => ok({callback, body: {user}}))
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
      .catch(ValidationError, e => badRequest({callback, body: {errorCode: apiErrorCodes.VALIDATION_ERROR, errors: e.errors}}))
      .catch(NotFoundError, e => notFound({callback}))
      .catch(AuthenticationError, e => unauthenticated({callback}))
      .catch(AuthorizationError, e => unauthorized({callback, body: {errorCode: apiErrorCodes.AUTHORIZATION_ERROR, errors: e.errors}}))
      .catch(EntityConflictError, e => error({callback, body: {errorCode: apiErrorCodes.ENTITY_CONFLICT, errors: e.errors}}))
      .catch(UserActionsConflictError, e => error({callback, body: {errorCode: apiErrorCodes.USER_ACTIONS_CONFLICT, errors: e.errors}}))
      .catch(e => {
        logger.error("Unexpected error")
        logger.error(e)
        return error({callback, body: {errorCode: apiErrorCodes.UNEXPECTED_ERROR}})
      })

module.exports = {
  routes,
  routeEvent,
  selectRoute,
}