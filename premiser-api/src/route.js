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
    id: 'searchPropositions',
    path: 'search-propositions',
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {
        queryStringParameters: { searchText }
      }
    }) =>
      appProvider.propositionsTextSearcher.search(searchText)
        .then( (rankedPropositions) => ok({callback, body: rankedPropositions}))
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
        .then( (rankedPropositions) => ok({callback, body: rankedPropositions}))
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
   * Propositions
   */
  {
    id: 'readTaggedPropositions',
    path: 'propositions',
    method: httpMethods.GET,
    queryStringParameters: {tagId: /.+/},
    handler: (appProvider, {
      request: {
        queryStringParameters: {tagId},
        authToken,
      },
      callback,
    }) => appProvider.propositionsService.readPropositionsForTagId(tagId, {authToken})
      .then((propositions) => ok({callback, body: {propositions}}))
  },
  {
    id: 'readPropositions',
    path: 'propositions',
    method: httpMethods.GET,
    handler: (appProvider, {
      request,
      callback
    }) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
        propositionIds: propositionIdsParam,
      } = request.queryStringParameters
      const sorts = decodeSorts(encodedSorts)
      if (propositionIdsParam) {
        const propositionIds = split(propositionIdsParam, ',')
        return appProvider.propositionsService.readPropositionsForIds(propositionIds)
          .then( (propositions) => ok({callback, body: {propositions}}) )
      } else {
        return appProvider.propositionsService.readPropositions({sorts, continuationToken, count})
          .then( ({propositions, continuationToken}) => ok({callback, body: {propositions, continuationToken}}) )
      }
    }
  },
  {
    id: 'createProposition',
    path: 'propositions',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {proposition},
        method,
        path
      }
    }) => appProvider.propositionsService.readOrCreateProposition(authToken, proposition)
      .then( ({proposition, isExtant}) => ok({callback, body: {proposition, isExtant}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('proposition'))
  },
  {
    id: 'readProposition',
    path: new RegExp('^propositions/([^/]+)$'),
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParameters: {},
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [propositionId],
        authToken,
      }
    }) => appProvider.propositionsService.readPropositionForId(propositionId, {authToken})
      .then( proposition => ok({callback, body: {proposition}}))
  },
  {
    id: 'updateProposition',
    path: new RegExp('^propositions/([^/]+)$'),
    method: httpMethods.PUT,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {proposition},
      }
    }) => appProvider.propositionsService.updateProposition(authToken, proposition)
      .then( (proposition) => ok({callback, body: {proposition}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('proposition'))
  },
  {
    id: 'deleteProposition',
    path: new RegExp('^propositions/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        method,
        path,
        pathParameters: [propositionId],
      }
    }) => appProvider.propositionsService.deleteProposition(authToken, propositionId)
      .then( () => ok({callback}) )
      .catch(AuthorizationError, rethrowTranslatedErrors('proposition'))
  },

  /*
   * Proposition justifications
   */
  {
    id: 'readPropositionJustifications',
    path: new RegExp('^propositions/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {
      include: 'justifications'
    },
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [propositionId],
        authToken,
      }
    }) => appProvider.propositionJustificationsService.readPropositionJustifications(propositionId, authToken)
      .then( ({proposition, justifications}) => ok({callback, body: {proposition, justifications}}) )
  },

  /*
   * Proposition compounds
   */
  {
    id: 'readPropositionCompound',
    path: new RegExp('^proposition-compounds/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [propositionCompoundId],
        authToken,
      }
    }) => appProvider.propositionCompoundsService.readPropositionCompoundForId(propositionCompoundId, {authToken})
      .then( (propositionCompound) => ok({callback, body: {propositionCompound}}))
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
    id: 'createPropositionTagVote',
    path: 'proposition-tag-votes',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        body: {propositionTagVote},
        authToken,
      }
    }) => appProvider.propositionTagVotesService.readOrCreatePropositionTagVote(authToken, propositionTagVote)
      .then( (propositionTagVote) => ok({callback, body: {propositionTagVote}}))
  },
  {
    id: 'deletePropositionTagVote',
    path: new RegExp('^proposition-tag-votes/([^/]+)$'),
    method: httpMethods.DELETE,
    handler: (appProvider, {
      callback,
      request: {
        pathParameters: [propositionTagVoteId],
        authToken,
      }
    }) => appProvider.propositionTagVotesService.deletePropositionTagVoteForId(authToken, propositionTagVoteId)
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

const selectRoute = (request) => {
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
    const routedRequest = assign({}, request, {pathParameters})
    return {route, routedRequest}
  }

  throw new NoMatchingRouteError()
}

const handleRequest = (appProvider, callback) => ({route, routedRequest}) =>
  route.handler(appProvider, {callback, request: routedRequest})

const routeRequest = (request, appProvider, callback) =>
  Promise.resolve(request)
    .then(selectRoute)
    .then(handleRequest(appProvider, callback))
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
  routeRequest,
  selectRoute,
}