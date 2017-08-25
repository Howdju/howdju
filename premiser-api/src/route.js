const Promise = require('bluebird')
const merge = require('lodash/merge')
const assign = require('lodash/assign')
const isEqual = require('lodash/isEqual')
const httpMethods = require('./httpMethods')
const httpStatusCodes = require('./httpStatusCodes')
const {CircularReferenceDetector} = require('./util/CircularReferenceDetector')

const {
  AuthenticationError,
  AuthorizationError,
  UserIsInactiveError,
  EntityNotFoundError,
  NoMatchingRouteError,
  EntityConflictError,
  UserActionsConflictError,
  EntityValidationError,
  RequestValidationError,
  InvalidLoginError,
} = require("./errors")
const apiErrorCodes = require('./codes/apiErrorCodes')
const {
  readStatements,
  readStatement,
  readStatementCompound,
  readStatementJustifications,
  login,
  logout,
  createUser,
  createVote,
  deleteVote,
  createStatement,
  updateStatement,
  deleteStatement,
  createJustification,
  deleteJustification,
  readCitationReference,
  readCitations,
  readCitationReferences,
  readJustifications,
  updateCitationReference,
  readFeaturedPerspectives,
  searchStatements,
  searchCitations,
} = require('./service')
const {logger} = require('./logger')
const {
  rethrowTranslatedErrors
} = require('./util')

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
    handler: ({request, callback}) => {
      const {
        continuationToken,
        count,
        sortProperty,
        sortDirection,
      } = request.queryStringParameters
      return readStatements({continuationToken, count, sortProperty, sortDirection})
        .then(({statements, continuationToken}) => ok({callback, body: {statements, continuationToken}}))
    }
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
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('statement'))
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
        .then( statement => ok({callback, body: {statement}}))
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('statement'))
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
        .then( statement => ok({callback, body: {statement}}))
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
    id: 'readStatementCompound',
    path: new RegExp('^statement-compounds/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: ({
                callback,
                request: {
                  pathParameters: [statementCompoundId],
                  authToken,
                }
              }) => readStatementCompound(authToken, statementCompoundId)
        .then( statementCompound => ok({callback, body: {statementCompound}}))
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
    }) => deleteStatement({authToken, statementId})
        .then( () => ok({callback}) )
        .catch(AuthorizationError, rethrowTranslatedErrors('statement'))
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
        .then( ({justification, isExtant}) => ok({callback, body: {justification, isExtant}}))
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('justification'))
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
        .then( citationReference => ok({callback, body: {citationReference}}))
        .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('citationReference'))
  },
  {
    id: 'readCitations',
    path: 'citations',
    method: httpMethods.GET,
    handler: ({request, callback}) => {
      const {
        continuationToken,
        count,
        sortProperty,
        sortDirection,
      } = request.queryStringParameters
      return readCitations({continuationToken, count, sortProperty, sortDirection})
          .then(({citations, continuationToken}) => ok({callback, body: {citations, continuationToken}}))
    }
  },
  {
    id: 'readCitationReferences',
    path: 'citationReferences',
    method: httpMethods.GET,
    handler: ({request, callback}) => {
      const {
        continuationToken,
        count,
        sortProperty,
        sortDirection,
      } = request.queryStringParameters
      return readCitationReferences({continuationToken, count, sortProperty, sortDirection})
          .then(({citationReferences, continuationToken}) => ok({callback, body: {citationReferences, continuationToken}}))
    }
  },
  {
    id: 'readJustifications',
    path: 'justifications',
    method: httpMethods.GET,
    handler: ({request, callback}) => {
      const {
        continuationToken,
        count,
        sortProperty,
        sortDirection,
        citationReferenceId,
        citationId,
        statementId,
        statementCompoundId,
      } = request.queryStringParameters
      const filters = {
        citationReferenceId,
        citationId,
        statementId,
        statementCompoundId,
      }
      return readJustifications({continuationToken, count, sortProperty, sortDirection, filters})
          .then(({justifications, continuationToken}) => ok({callback, body: {justifications, continuationToken}}))
    }
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
        .catch(AuthorizationError, rethrowTranslatedErrors('justification'))
  },
  {
    path: 'login',
    method: httpMethods.POST,
    handler: ({callback, request: {body: {credentials}}}) => login(credentials)
        .then(({user, authToken}) => ok({callback, body: {user, authToken}}))
        .catch(EntityNotFoundError, () => {
          // Hide EntityNotFoundError to prevent someone from learning that an email does or does not correspond to an account
          throw new InvalidLoginError()
        })
  },
  {
    path: 'logout',
    method: httpMethods.POST,
    handler: ({callback, request: {authToken}}) => logout(authToken).then( () => ok({callback}) )
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
    handler: ({
                callback,
                request: {
                  body: {vote},
                  authToken,
                }}) =>
        deleteVote({authToken, vote})
            .then( () => ok({callback}) )
  },
  {
    id: 'createUser',
    path: 'users',
    method: httpMethods.POST,
    handler: ({callback, request: {body: {authToken, user}}}) => createUser(authToken, user)
        .then( user => ok({callback, body: {user}}))
  },
  {
    id: 'readFeaturedPerspectives',
    path: new RegExp('^perspectives$'),
    method: httpMethods.GET,
    queryStringParameters: {
      featured: '',
    },
    handler: ({
                callback,
                request: {authToken}
              }) => readFeaturedPerspectives(authToken)
        .then( perspectives => {
          const detector = new CircularReferenceDetector();
          detector.detectCircularReferences(perspectives)
          return perspectives
        })
        .then( perspectives => ok({callback, body: {perspectives}}) )
  },
]

const selectRoute = ({path, method, queryStringParameters}) => Promise.resolve()
    .then(() => {

      for (let route of routes) {
        let match

        if (route.method && route.method !== method) continue
        if (typeof route.path === 'string' && route.path !== path) continue
        if (route.path instanceof RegExp && !(match = route.path.exec(path))) continue
        if (route.queryStringParameters && !isEqual(route.queryStringParameters, queryStringParameters)) continue

        // First item is the whole match, rest are the group matches
        const pathParameters = match ? match.slice(1) : undefined
        return {route, pathParameters}
      }

      throw new NoMatchingRouteError()
    })

const routeEvent = ({callback, request}) =>
  selectRoute(request)
      .then( ({route, pathParameters}) => route.handler({callback, request: assign({}, request, {pathParameters})}) )
      .catch(e => {
        logger.silly(e)
        throw e
      })
      .catch(EntityValidationError, e => badRequest({
        callback,
        body: {
          errorCode: apiErrorCodes.VALIDATION_ERROR,
          errors: e.errors
        }
      }))
      .catch(RequestValidationError, e => badRequest({callback, body: {message: e.message}}))
      .catch(EntityNotFoundError, e => notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.NOT_FOUND,
          entityType: e.entityType,
          identifier: e.identifier
        }
      }))
      .catch(NoMatchingRouteError, e => notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.NOT_FOUND,
          reason: 'No matching route'
        }
      }))
      .catch(AuthenticationError, e => unauthenticated({callback}))
      .catch(InvalidLoginError, e => badRequest({
        callback,
        body: {
          errorCode: apiErrorCodes.INVALID_LOGIN_CREDENTIALS,
          errors: e.errors
        }
      }))
      .catch(AuthorizationError, e => unauthorized({
        callback,
        body: {
          errorCode: apiErrorCodes.AUTHORIZATION_ERROR,
          errors: e.errors
        }
      }))
      .catch(UserIsInactiveError, e => error({
        callback,
        body: {
          errorCode: apiErrorCodes.USER_IS_INACTIVE_ERROR
        }
      }))
      .catch(EntityConflictError, e => error({
        callback,
        body: {
          errorCode: apiErrorCodes.ENTITY_CONFLICT,
          errors: e.errors
        }
      }))
      .catch(UserActionsConflictError, e => error({
        callback,
        body: {
          errorCode: apiErrorCodes.USER_ACTIONS_CONFLICT,
          errors: e.errors
        }
      }))
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