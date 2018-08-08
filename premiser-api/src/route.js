const Promise = require('bluebird')
const assign = require('lodash/assign')
const forEach = require('lodash/forEach')
const isEmpty = require('lodash/isEmpty')
const isUndefined = require('lodash/isUndefined')
const split = require('lodash/split')

const {
  apiErrorCodes,
  decodeQueryStringObject,
  decodeSorts,
  httpStatusCodes,
  httpMethods,
} = require('howdju-common')
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
  rethrowTranslatedErrors,
} = require("howdju-service-common")


const ok = ({callback, body={}, headers}) => callback({
  httpStatusCode: httpStatusCodes.OK,
  headers,
  body
})
/* eslint-disable no-unused-vars */
const noContent = (appProvider, args) => {
  // NO CONTENT must not have a body. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204
  if (args.body) appProvider.logger.error('noContent may not return a body.  Ignoring body')
  return args.callback({
    httpStatusCode: httpStatusCodes.NO_CONTENT
  })
}
/* eslint-enable no-unused-vars */
const notFound = ({callback, body}) => callback({
  httpStatusCode: httpStatusCodes.NOT_FOUND,
  body,
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
  /*
   * Options
   */
  {
    method: httpMethods.OPTIONS,
    handler: (appProvider, {callback}) => ok({callback})
  },

  /*
   * Search
   */
  {
    id: 'searchStatements',
    path: 'search-statements',
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {
        queryStringParameters: { searchText }
      }
    }) =>
      appProvider.statementsTextSearcher.search(searchText)
        .then( (rankedStatements) => ok({callback, body: rankedStatements}))
  },
  {
    id: 'searchTags',
    path: 'search-tags',
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {
        queryStringParameters: { searchText }
      }
    }) =>
      appProvider.tagsService.readTagsLikeTagName(searchText)
        .then( (rankedStatements) => ok({callback, body: rankedStatements}))
  },
  {
    id: 'searchWrits',
    path: 'search-writs',
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {
        queryStringParameters: { searchText }
      },
    }) =>
      appProvider.writsTitleSearcher.search(searchText)
        .then( (rankedWrits) => ok({callback, body: rankedWrits}))
  },
  {
    id: 'mainSearch',
    path: 'search',
    method: httpMethods.GET,
    handler: (appProvider, {callback, request: { queryStringParameters: { searchText }}}) =>
      appProvider.mainSearchService.search(searchText)
        .then( (results) => ok({callback, body: results}))
  },

  {
    id: 'readTag',
    path: new RegExp('^tags/([^/]+)$'),
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [tagId],
      }
    }) => appProvider.tagsService.readTagForId(tagId)
      .then( tag => ok({callback, body: {tag}}))
  },

  /*
   * Statements
   */
  {
    id: 'readTaggedStatements',
    path: 'statements',
    method: httpMethods.GET,
    queryStringParameters: {tagId: /.+/},
    handler: (appProvider, {
      request: {
        queryStringParameters: {tagId},
        authToken,
      },
      callback,
    }) => appProvider.statementsService.readStatementsForTagId(tagId, {authToken})
      .then((statements) => ok({callback, body: {statements}}))
  },
  {
    id: 'readStatements',
    path: 'statements',
    method: httpMethods.GET,
    handler: (appProvider, {
      request,
      callback
    }) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
        statementIds: statementIdsParam,
      } = request.queryStringParameters
      const sorts = decodeSorts(encodedSorts)
      if (statementIdsParam) {
        const statementIds = split(statementIdsParam, ',')
        return appProvider.statementsService.readStatementsForIds(statementIds)
          .then( (statements) => ok({callback, body: {statements}}) )
      } else {
        return appProvider.statementsService.readStatements({sorts, continuationToken, count})
          .then( ({statements, continuationToken}) => ok({callback, body: {statements, continuationToken}}) )
      }
    }
  },
  {
    id: 'createStatement',
    path: 'statements',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {statement},
        method,
        path
      }
    }) => appProvider.statementsService.readOrCreateStatement(authToken, statement)
      .then( ({statement, isExtant}) => ok({callback, body: {statement, isExtant}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('statement'))
  },
  {
    id: 'readStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [statementId],
        authToken,
      }
    }) => appProvider.statementsService.readStatementForId(statementId, {authToken})
      .then( statement => ok({callback, body: {statement}}))
  },
  {
    id: 'updateStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.PUT,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {statement},
      }
    }) => appProvider.statementsService.updateStatement(authToken, statement)
      .then( (statement) => ok({callback, body: {statement}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('statement'))
  },
  {
    id: 'deleteStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        method,
        path,
        pathParameters: [statementId],
      }
    }) => appProvider.statementsService.deleteStatement(authToken, statementId)
      .then( () => ok({callback}) )
      .catch(AuthorizationError, rethrowTranslatedErrors('statement'))
  },

  /*
   * Statement justifications
   */
  {
    id: 'readStatementJustifications',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {
      include: 'justifications'
    },
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [statementId],
        authToken,
      }
    }) => appProvider.statementJustificationsService.readStatementJustifications(statementId, authToken)
      .then( ({statement, justifications}) => ok({callback, body: {statement, justifications}}) )
  },

  /*
   * Statement compounds
   */
  {
    id: 'readStatementCompound',
    path: new RegExp('^statement-compounds/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [statementCompoundId],
        authToken,
      }
    }) => appProvider.statementCompoundsService.readStatementCompoundForId(statementCompoundId, {authToken})
      .then( (statementCompound) => ok({callback, body: {statementCompound}}))
  },

  /*
   * Justification basis compounds
   */
  {
    id: 'readJustificationBasisCompound',
    path: new RegExp('^justification-basis-compounds/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [justificationBasisCompoundId],
        authToken,
      }
    }) => appProvider.justificationBasisCompoundsService.readJustificationBasisCompoundForId(justificationBasisCompoundId, {authToken})
      .then( (justificationBasisCompound) => ok({callback, body: {justificationBasisCompound}}) )
  },

  /*
   * Source excerpt paraphrases
   */
  {
    id: 'readSourceExcerptParaphrase',
    path: new RegExp('^source-excerpt-paraphrases/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [sourceExcerptParaphraseId],
        authToken,
      }
    }) => appProvider.sourceExcerptParaphrasesService.readSourceExcerptParaphraseForId(sourceExcerptParaphraseId, {authToken})
      .then( (sourceExcerptParaphrase) => ok({callback, body: {sourceExcerptParaphrase}}) )
  },

  /*
   * Justifications
   */
  {
    id: 'createJustification',
    path: 'justifications',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {
          justification
        },
      }
    }) => appProvider.justificationsService.readOrCreateJustification(justification, authToken)
      .then( ({justification, isExtant}) => ok({callback, body: {justification, isExtant}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('justification'))
  },
  {
    id: 'readJustifications',
    path: 'justifications',
    method: httpMethods.GET,
    handler: (appProvider, {request, callback}) => {
      const {
        filters: encodedFilters,
        sorts: encodedSorts,
        continuationToken,
        count,
      } = request.queryStringParameters
      const filters = decodeQueryStringObject(encodedFilters)
      const sorts = decodeSorts(encodedSorts)
      return appProvider.justificationsService.readJustifications({filters, sorts, continuationToken, count})
        .then( ({justifications, continuationToken}) => ok({callback, body: {justifications, continuationToken}}))
    }
  },
  {
    id: 'deleteJustification',
    path: new RegExp('^justifications/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        method,
        path,
        pathParameters: [justificationId]
      }
    }) => appProvider.justificationsService.deleteJustification(authToken, justificationId)
      .then( () => ok({callback}) )
      .catch(AuthorizationError, rethrowTranslatedErrors('justification'))
  },

  /*
   * Writ quotes
   */
  {
    id: 'readWritQuotes',
    path: 'writ-quotes',
    method: httpMethods.GET,
    handler: (appProvider, {request, callback}) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
      } = request.queryStringParameters
      const sorts = decodeSorts(encodedSorts)
      return appProvider.writQuotesService.readWritQuotes({sorts, continuationToken, count})
        .then( ({writQuotes, continuationToken}) => ok({callback, body: {writQuotes, continuationToken}}))
    }
  },
  {
    id: 'readWritQuote',
    path: new RegExp('^writ-quotes/([^/]+)$'),
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [writQuoteId],
        authToken,
      }
    }) => {
      return appProvider.writQuotesService.readWritQuoteForId(writQuoteId, {authToken})
        .then( (writQuote) => ok({callback, body: {writQuote}}))
    }
  },
  {
    id: 'updateWritQuote',
    path: new RegExp('^writ-quotes/([^/]+)$'),
    method: httpMethods.PUT,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {
          writQuote
        }
      }
    }) => appProvider.writQuotesService.updateWritQuote({authToken, writQuote})
      .then( (writQuote) => ok({callback, body: {writQuote}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('writQuote'))
  },

  /*
   * Writs
   */
  {
    id: 'readWrits',
    path: 'writs',
    method: httpMethods.GET,
    handler: (appProvider, {request, callback}) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
      } = request.queryStringParameters
      const sorts = decodeSorts(encodedSorts)
      return appProvider.writsService.readWrits({sorts, continuationToken, count})
        .then( ({writs, continuationToken}) => ok({callback, body: {writs, continuationToken}}))
    }
  },

  /*
   * Auth
   */
  {
    path: 'login',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {body: {credentials}}}) =>
      appProvider.authService.login(credentials)
        .then( ({user, authToken, expires}) => ok({callback, body: {user, authToken, expires}}) )
        .catch(EntityNotFoundError, () => {
          // Hide EntityNotFoundError to prevent someone from learning that an email does or does not correspond to an account
          throw new InvalidLoginError()
        })
  },
  {
    path: 'logout',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {authToken}}) =>
      appProvider.authService.logout(authToken)
        .then( () => ok({callback}) )
  },

  /*
   * Votes
   */
  {
    id: 'createJustificationVote',
    path: new RegExp('^justification-votes$'),
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        body: {
          justificationVote
        },
        authToken
      }
    }) => appProvider.justificationVotesService.createVote(authToken, justificationVote)
      .then( (justificationVote) => ok({callback, body: {justificationVote}}))
  },
  {
    id: 'deleteJustificationVote',
    path: new RegExp('^justification-votes$'),
    method: httpMethods.DELETE,
    handler: (appProvider, {
      callback,
      request: {
        body: {justificationVote},
        authToken,
      }
    }) =>
      appProvider.justificationVotesService.deleteVote(authToken, justificationVote)
        .then( () => ok({callback}) )
  },

  {
    id: 'createStatementTagVote',
    path: 'statement-tag-votes',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        body: {statementTagVote},
        authToken,
      }
    }) => appProvider.statementTagVotesService.readOrCreateStatementTagVote(authToken, statementTagVote)
      .then( (statementTagVote) => ok({callback, body: {statementTagVote}}))
  },
  {
    id: 'deleteStatementTagVote',
    path: new RegExp('^statement-tag-votes/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [statementTagVoteId],
        authToken,
      }
    }) => appProvider.statementTagVotesService.deleteStatementTagVoteForId(authToken, statementTagVoteId)
      .then(() => ok({callback}))
  },

  /*
   * Users
   */
  {
    id: 'createUser',
    path: 'users',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {body: {authToken, user}}}) =>
      appProvider.usersService.createUser(authToken, user)
        .then( (user) => ok({callback, body: {user}}))
  },

  /*
   * Perspectives
   */
  {
    id: 'readFeaturedPerspectives',
    path: new RegExp('^perspectives$'),
    method: httpMethods.GET,
    queryStringParameters: {
      featured: '',
    },
    handler: (appProvider, {
      callback,
      request: {authToken}
    }) => appProvider.perspectivesService.readFeaturedPerspectives(authToken)
      .then( (perspectives) => ok({callback, body: {perspectives}}) )
  },
]

const selectRoute = (request) => Promise.resolve()
  .then(() => {
    const {
      path,
      method,
      queryStringParameters
    } = request

    for (let route of routes) {
      let pathMatch

      if (route.method && route.method !== method) continue
      if (typeof route.path === 'string' && route.path !== path) continue
      if (route.path instanceof RegExp && !(pathMatch = route.path.exec(path))) continue
      if (route.queryStringParameters) {
        if (isEmpty(route.queryStringParameters) !== isEmpty(queryStringParameters)) {
          continue
        }

        let isMisMatch = false
        forEach(route.queryStringParameters, (value, name) => {
          const requestValue = queryStringParameters[name] || ''
          if (value instanceof RegExp) {
            // The regex methods cast undefined to the string 'undefined', matching some regexes you might not expect...
            if (isUndefined(requestValue) || !value.test(requestValue)) {
              isMisMatch = true
            }
          } else if (value !== requestValue) {
            isMisMatch = true
          }
        })
        if (isMisMatch) {
          continue
        }
      }

      // First item is the whole match, rest are the group matches
      const pathParameters = pathMatch ? pathMatch.slice(1) : undefined
      return {route, pathParameters}
    }

    throw new NoMatchingRouteError()
  })

const routeEvent = (request, appProvider, callback) =>
  selectRoute(request)
    .then( ({route, pathParameters}) => route.handler(appProvider, {callback, request: assign({}, request, {pathParameters})}) )
    .catch(err => {
      appProvider.logger.silly('Error handling route', {err})
      throw err
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
        errorCode: apiErrorCodes.ENTITY_NOT_FOUND,
        entityType: e.entityType,
        identifier: e.identifier
      }
    }))
    .catch(NoMatchingRouteError, e => notFound({ callback, body: {errorCode: apiErrorCodes.ROUTE_NOT_FOUND,} }))
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
    .catch(err => {
      appProvider.logger.error('Unexpected error', {err})
      return error({callback, body: {errorCode: apiErrorCodes.UNEXPECTED_ERROR}})
    })

module.exports = {
  routes,
  routeEvent,
  selectRoute,
}