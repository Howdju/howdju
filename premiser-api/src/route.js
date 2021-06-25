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
  JustificationRootTargetType,
} = require('howdju-common')
const {
  AuthenticationError,
  AuthorizationError,
  EntityConflictError,
  EntityNotFoundError,
  EntityValidationError,
  InvalidLoginError,
  NoMatchingRouteError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
  rethrowTranslatedErrors,
  RequestValidationError,
  UserActionsConflictError,
  UserIsInactiveError,
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
    id: 'searchPersorgs',
    path: 'search-persorgs',
    method: httpMethods.GET,
    async handler(appProvider, {
      callback,
      request: {
        queryStringParameters: { searchText }
      },
    }) {
      const rankedPersorgs = await appProvider.persorgsNameSearcher.search(searchText)
      return ok({callback, body: rankedPersorgs})
    }
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
        pathParameters: [propositionId],
      }
    }) => appProvider.propositionsService.deleteProposition(authToken, propositionId)
      .then( () => ok({callback}) )
      .catch(AuthorizationError, rethrowTranslatedErrors('proposition'))
  },

  /*
   * Statements
   */
  {
    id: 'createStatement',
    path: new RegExp('^statements$'),
    method: httpMethods.POST,
    async handler(appProvider, {
      callback,
      request: {
        authToken,
        body: {statement: inStatement}}
    }) {
      const {isExtant, statement} = await appProvider.statementsService.readOrCreate(inStatement, authToken)
      return ok({callback, body: {isExtant, statement}})
    }
  },
  {
    id: 'readSpeakerStatements',
    path: 'statements',
    method: httpMethods.GET,
    queryStringParameters: {speakerPersorgId: /.+/},
    async handler(appProvider, {
      callback,
      request: {
        queryStringParameters: {speakerPersorgId},
      }
    }) {
      const statements = await appProvider.statementsService.readStatementsForSpeakerPersorgId(speakerPersorgId)
      return ok({callback, body: {statements}})
    }
  },
  {
    id: 'readSentenceStatements',
    path: 'statements',
    method: httpMethods.GET,
    queryStringParameters: {
      sentenceType: /.+/,
      sentenceId: /.+/,
    },
    async handler(appProvider, {
      callback,
      request: {
        queryStringParameters: {
          sentenceType,
          sentenceId,
        },
      }
    }) {
      const statements = await appProvider.statementsService.readStatementsForSentenceTypeAndId(sentenceType, sentenceId)
      return ok({callback, body: {statements}})
    }
  },
  {
    id: 'readIndirectRootPropositionStatements',
    path: 'statements',
    method: httpMethods.GET,
    queryStringParameters: {
      rootPropositionId: /.+/,
      indirect: '',
    },
    async handler(appProvider, {
      callback,
      request: {
        queryStringParameters: {rootPropositionId},
      }
    }) {
      const statements = await appProvider.statementsService.readIndirectStatementsForRootPropositionId(rootPropositionId)
      return ok({callback, body: {statements}})
    }
  },
  {
    id: 'readRootPropositionStatements',
    path: 'statements',
    method: httpMethods.GET,
    queryStringParameters: {
      rootPropositionId: /.+/,
    },
    async handler(appProvider, {
      callback,
      request: {
        queryStringParameters: {rootPropositionId},
      }
    }) {
      const statements = await appProvider.statementsService.readStatementsForRootPropositionId(rootPropositionId)
      return ok({callback, body: {statements}})
    }
  },
  {
    id: 'readStatement',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParameters: {},
    async handler(appProvider, {
      callback,
      request: {
        pathParameters: [statementId]
      }
    }) {
      const {statement} = await appProvider.statementsService.readStatementForId(statementId)
      return ok({callback, body: {statement}})
    }
  },

  /*
   * Persorgs
   */
  {
    id: 'readPersorg',
    path: new RegExp('^persorgs/([^/]+)$'),
    method: httpMethods.GET,
    async handler(appProvider, {
      callback,
      request: {
        pathParameters: [persorgId]
      }
    }) {
      const persorg = await appProvider.persorgsService.readPersorgForId(persorgId)
      return ok({callback, body: {persorg}})
    }
  },
  {
    id: 'updatePersorg',
    path: new RegExp('^persorgs/([^/]+)$'),
    method: httpMethods.PUT,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {
          persorg
        }
      }
    }) => Promise.resolve(appProvider.persorgsService.update(persorg, authToken))
      .then( (persorg) => ok({callback, body: {persorg}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('persorg'))
  },

  /*
   * Root target justifications
   */
  {
    id: 'readPropositionJustifications',
    path: new RegExp('^propositions/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {
      include: 'justifications'
    },
    handler: async (appProvider, {
      callback,
      request: {
        pathParameters: [propositionId],
        authToken,
      }
    }) => {
      const proposition = await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
        JustificationRootTargetType.PROPOSITION, propositionId, authToken)
      return ok({callback, body: {proposition}})
    }
  },
  {
    id: 'readStatementJustifications',
    path: new RegExp('^statements/([^/]+)$'),
    method: httpMethods.GET,
    queryStringParameters: {
      include: 'justifications'
    },
    handler: async (appProvider, {
      callback,
      request: {
        pathParameters: [statementId],
        authToken,
      }
    }) => {
      const statement = await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
        JustificationRootTargetType.STATEMENT, statementId, authToken)
      return ok({callback, body: {statement}})
    }
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
    }) => Promise.resolve(appProvider.justificationsService.readOrCreate(justification, authToken))
      .then( ({justification, isExtant}) => ok({callback, body: {justification, isExtant}}))
      .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('justification'))
  },
  {
    id: 'readJustifications',
    path: 'justifications',
    method: httpMethods.GET,
    handler: async (appProvider, {request, callback}) => {
      const {
        filters: encodedFilters,
        sorts: encodedSorts,
        continuationToken,
        count,
        includeUrls,
      } = request.queryStringParameters
      const filters = decodeQueryStringObject(encodedFilters)
      const sorts = decodeSorts(encodedSorts)
      const {justifications, continuationToken: newContinuationToken} =
        await appProvider.justificationsService.readJustifications(
          {filters, sorts, continuationToken, count, includeUrls})
      return ok({callback, body: {justifications, continuationToken: newContinuationToken}})
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
    id: 'login',
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
    id: 'logout',
    path: 'logout',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {authToken}}) =>
      appProvider.authService.logout(authToken)
        .then( () => ok({callback}) )
  },
  {
    id: 'requestPasswordReset',
    path: 'password-reset-requests',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {body: {passwordResetRequest}}}) =>
      Promise.resolve(appProvider.passwordResetService.createRequest(passwordResetRequest))
        .then( (duration) => ok({callback, body: {duration}}))
  },
  {
    id: 'readPasswordReset',
    path: 'password-reset-requests',
    method: httpMethods.GET,
    handler: (appProvider, {callback, request: {queryStringParameters: {passwordResetCode}}}) =>
      Promise.resolve(appProvider.passwordResetService.checkRequestForCode(passwordResetCode))
        .then( (email) => ok({callback, body: {email}}))
  },
  {
    id: 'completePasswordReset',
    path: 'password-resets',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        body: {
          passwordResetCode,
          passwordResetConfirmation,
        }
      }}) =>
      Promise.resolve(appProvider.passwordResetService.resetPasswordAndLogin(passwordResetCode, passwordResetConfirmation))
        .then( ({user, authToken, expires}) => ok({callback, body: {user, authToken, expires}}))
  },
  {
    id: 'requestRegistration',
    path: 'registration-requests',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {body: {registrationRequest}}}) =>
      Promise.resolve(appProvider.registrationService.createRequest(registrationRequest))
        .then( (duration) => ok({callback, body: {duration}}) )
        .catch(EntityValidationError, EntityConflictError, rethrowTranslatedErrors('registrationRequest'))
  },
  {
    id: 'readRegistrationRequest',
    path: 'registration-requests',
    method: httpMethods.GET,
    handler: (appProvider, {callback, request: {queryStringParameters: {registrationCode}}}) =>
      Promise.resolve(appProvider.registrationService.checkRequestForCode(registrationCode))
        .then( (email) => ok({callback, body: {email}}) )
  },
  {
    id: 'register',
    path: 'registrations',
    method: httpMethods.POST,
    handler: (appProvider, {callback, request: {body: {registrationConfirmation}}}) =>
      Promise.resolve(appProvider.registrationService.confirmRegistrationAndLogin(registrationConfirmation))
        .then( ({user, authToken, expires}) => ok({callback, body: {user, authToken, expires}}) )
        .catch(EntityValidationError, EntityConflictError, rethrowTranslatedErrors('registrationConfirmation'))
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
      appProvider.usersService.createUserAsAuthToken(authToken, user)
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

  /*
   * Account settings
   */
  {
    id: 'createAccountSettings',
    path: 'account-settings',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {
          accountSettings,
        }
      },
    }) => appProvider.accountSettingsService.createAccountSettings(authToken, accountSettings)
      .then( (accountSettings) => ok({callback, body: {accountSettings}}) )
  },
  {
    id: 'readAccountSettings',
    path: 'account-settings',
    method: httpMethods.GET,
    handler: (appProvider, {
      callback,
      request: {authToken},
    }) => appProvider.accountSettingsService.readAccountSettings(authToken)
      .then( (accountSettings) => ok({callback, body: {accountSettings}}) )
  },
  {
    id: 'updateAccountSettings',
    path: 'account-settings',
    method: httpMethods.PUT,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {
          accountSettings,
        }
      },
    }) => appProvider.accountSettingsService.update(accountSettings, authToken)
      .then( (accountSettings) => ok({callback, body: {accountSettings}}) )
  },

  /*
   * Account settings
   */
  {
    id: 'createContentReport',
    path: 'content-reports',
    method: httpMethods.POST,
    handler: (appProvider, {
      callback,
      request: {
        authToken,
        body: {
          contentReport,
        }
      },
    }) => appProvider.contentReportsService.createContentReport(authToken, contentReport)
      .then( (accountSettings) => ok({callback}) )
  },
]

const selectRoute = (appProvider) => (request) => {
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
    appProvider.logger.debug(`selected route ${route.id}`)
    return {route, routedRequest}
  }

  throw new NoMatchingRouteError()
}

const handleRequest = (appProvider, callback) => ({route, routedRequest}) =>
  route.handler(appProvider, {callback, request: routedRequest})

const routeRequest = (request, appProvider, callback) =>
  Promise.resolve(request)
    .then(selectRoute(appProvider))
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
    .catch(NoMatchingRouteError, e => notFound({ callback, body: {errorCode: apiErrorCodes.ROUTE_NOT_FOUND} }))
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
    .catch(RegistrationExpiredError, e => notFound({
      callback,
      body: {
        errorCode: apiErrorCodes.EXPIRED
      }
    }))
    .catch(RegistrationAlreadyConsumedError, e => notFound({
      callback,
      body: {
        errorCode: apiErrorCodes.CONSUMED
      }
    }))
    .catch(err => {
      appProvider.logger.error('Unexpected error', {err, stack: err.stack})
      return error({callback, body: {errorCode: apiErrorCodes.UNEXPECTED_ERROR}})
    })

module.exports = {
  routes,
  routeRequest,
  selectRoute,
}
