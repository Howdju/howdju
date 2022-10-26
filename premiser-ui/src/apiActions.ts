import reduce from 'lodash/reduce'
import {
  PayloadActionCreator,
  PrepareAction,
  ActionCreatorWithPreparedPayload,
} from '@reduxjs/toolkit'
import {schema} from 'normalizr'
import {isEmpty, isFunction, join, pick} from 'lodash'
import queryString from 'query-string'

import {
  EntityId,
  JustificationVotePolarities,
  PropositionTagVotePolarities,
  WritQuote,
  JustificationRootTargetType,
  Proposition,
  Tag,
  Persisted,
  PropositionTagVote,
  makePropositionTagVoteSubmissionModel,
  JustificationRootTargetTypes,
  httpMethods,
  HttpMethod,
  JustificationRootTargetInfo,
  decircularizeProposition,
  decircularizeJustification,
  SortDirections,
  encodeQueryStringObject,
  JustificationSearchFilters,
} from 'howdju-common'

import {
  accountSettingsSchema,
  justificationSchema,
  justificationsSchema,
  justificationVoteSchema,
  mainSearchResultsSchema,
  persorgSchema,
  persorgsSchema,
  propositionCompoundSchema,
  propositionSchema,
  propositionsSchema,
  propositionTagVoteSchema,
  sourceExcerptParaphraseSchema,
  statementSchema,
  statementsSchema,
  tagSchema,
  tagsSchema,
  userSchema,
  writQuoteSchema,
  writQuotesSchema,
  writsSchema,
} from './normalizationSchemas'
import {actionTypeDelim, createAction} from './actionHelpers'
import {str} from './actionHelpers'
import {UiErrorType} from './uiErrors'
import {SuggestionsKey} from './types'

/**
 * ApiActionCreator types must be strings because we generate them.
 *
 * @typeparam P payload type
 * @typeparam RP response payload type
 * @typeparam PA prepare action type
 */
type ApiActionCreator<P, RP, PA extends void | PrepareAction<P>> = PayloadActionCreator<
  P,
  string,
  PA
> & {
  response: ActionCreatorWithPreparedPayload<unknown[], RP, string, Error, ApiActionMeta>
}

const makeApiActionTypes = (type: string) => {
  const requestType = 'API' + actionTypeDelim + type
  const responseType = requestType + actionTypeDelim + 'RESPONSE'
  return [requestType, responseType]
}

export type ApiActionMeta<P = any> = {
  normalizationSchema: any
  requestPayload: P
}

/**
 * @typeparam N the type of the normalization schema
 */
interface ResourceApiConfig<N> {
  endpoint: string
  normalizationSchema?: N
  fetchInit?: {
    method: HttpMethod
    body?: any
  }
  canSkipRehydrate?: boolean
  cancelKey?: string
}

/**
 * Converts a normalizr schema into a response payload.
 *
 * Replaces the schemas with their generic entity type.
 *
 * For example, given this schema:
 *
 * ```typescript
 * const someSchema: {
 *   proposition: schema.Entity<Proposition>;
 *   example: {
 *       justification: schema.Entity<Justification>;
 *   };
 * }
 * ```
 *
 * `ExtractSchemaEntity<typeof someSchema>` will be:
 *
 * ```typescript
 * type someSchemaEntities = {
 *   proposition: Proposition;
 *   example: {
 *       justification: Justification;
 *   };
 * }
 * ```
 */
type ExtractSchemaEntity<S> = S extends schema.Entity<infer E>
  ? E
  : {
      [Key in keyof S]: ExtractSchemaEntity<S[Key]>
    }

/** Properties that may be present on API responses */
interface ApiResponseWrapper {
  /**
   * Whether an entity equivalent to the top-level entity of a POST's body already existed on the
   * server.
   *
   * Although this should only be present for responses to Create/POSTs, it seemed overly complicated
   * to try and type it into the response action creator. So we make it optional on all responses.
   */
  isExtant?: boolean
  /** A pagination token. */
  continuationToken: string
}

type Prepared<P> = {payload: P; meta?: any}

/**
 * Create an action creator having a property `.response` with another action creator for corresponding API responses
 *
 * @param type the type of the action
 * @param payloadCreatorOrPrepare a function that creates the payload directory or returns a
 *   @reduxjs/toolkit prepared object.
 * @param apiConfigCreator the resource config for the API endpoint, or a function for creating it from
 *   the payload. The apiConfig's normalizationSchema determines the payload of the response actions.
 * @typeparam P the payload type
 * @typeparam N the type of the normalization schema. Used to infer the payload of the response action.
 * @typeparam PA the prepare function type
 */
function apiActionCreator<P, N, PA extends (...args: any[]) => {payload: P}>(
  type: string,
  payloadCreatorOrPrepare?: (...args: any[]) => P | Prepared<P>,
  apiConfigCreator?: ResourceApiConfig<N> | ((p: P) => ResourceApiConfig<N>),
): ApiActionCreator<P, ExtractSchemaEntity<N> & ApiResponseWrapper, PA> {
  const [requestType, responseType] = makeApiActionTypes(type)

  // Add apiConfig to meta
  const requestPrepare = function requestPrepare(...args: any[]) {
      let prepared = payloadCreatorOrPrepare ? payloadCreatorOrPrepare(...args) : {} as Prepared<P>
      if (apiConfigCreator) {
        if (!('payload' in prepared)) {
          // Allow payloadCreatorOrPrepare to return an object that already has payload in it,
          // otherwise make the entire return value the payload.
          prepared = {payload: prepared, meta: {}}
        } else if (!prepared.meta) {
          prepared.meta = {}
        }

        prepared.meta.apiConfig = isFunction(apiConfigCreator)
          ? apiConfigCreator(prepared.payload)
          : apiConfigCreator
      }
      return prepared
    }

  type Response = ExtractSchemaEntity<N> & ApiResponseWrapper

  const ac = requestPrepare
    ? (createAction(requestType, requestPrepare) as ApiActionCreator<P, Response, PA>)
    : (createAction(requestType) as ApiActionCreator<P, Response, PA>)

  ac.response = createAction(
    responseType,
    (payload: ExtractSchemaEntity<N>, meta: ApiActionMeta<P>) => ({
      payload,
      meta,
    }),
  ) as ActionCreatorWithPreparedPayload<unknown[], Response, string, Error, ApiActionMeta>
  return ac
}

type ContinuationQueryStringParams = {
  continuationToken: string
  count: number
  sorts?: string
}

interface JustificationSearchQueryStringParams {
  filters?: string
  includeUrls?: string
  sorts?: string
  count?: number
  continuationToken?: string
}

const rootTargetEndpointsByType = {
  [JustificationRootTargetTypes.PROPOSITION]: {
    endpoint: 'propositions',
    normalizationSchema: {proposition: propositionSchema},
  },
  [JustificationRootTargetTypes.STATEMENT]: {
    endpoint: 'statements',
    normalizationSchema: {statement: statementSchema},
  },
  [JustificationRootTargetTypes.JUSTIFICATION]: {
    endpoint: 'statements',
    normalizationSchema: {justification: justificationSchema},
  },
}

const defaultSorts = `created=${SortDirections.DESCENDING}`

export const callApiResponse = createAction(
  'CALL_API_RESPONSE',
  result => result,
) as ActionCreatorWithPreparedPayload<
  unknown[], // Args
  {errorType: UiErrorType},
  string, // Type
  Error,
  unknown // Meta
>

/** Actions that directly result in API calls */
export const api = {
  fetchProposition: apiActionCreator(
    'FETCH_PROPOSITION',
    (propositionId: EntityId) => ({propositionId}),
    payload => ({
      endpoint: `propositions/${payload.propositionId}`,
      normalizationSchema: {proposition: propositionSchema},
    }),
  ),
  fetchPropositions: apiActionCreator(
    'FETCH_PROPOSITIONS',
    (propositionIds: EntityId[]) => ({propositionIds}),
    payload => {
      const query = payload.propositionIds
        ? `?${queryString.stringify({
            propositionIds: join(payload.propositionIds, ','),
          })}`
        : ''
      return {
        endpoint: `propositions${query}`,
        normalizationSchema: {propositions: propositionsSchema},
      }
    },
  ),
  fetchPropositionCompound: apiActionCreator(
    'FETCH_PROPOSITION_COMPOUND',
    (propositionCompoundId: EntityId) => ({propositionCompoundId}),
    payload => ({
      endpoint: `proposition-compounds/${payload.propositionCompoundId}`,
      normalizationSchema: {propositionCompound: propositionCompoundSchema},
    }),
  ),
  fetchRootJustificationTarget: apiActionCreator(
    'FETCH_ROOT_JUSTIFICATION_TARGET',
    (
      rootTargetType: JustificationRootTargetType,
      rootTargetId: EntityId,
    ): JustificationRootTargetInfo => ({
      rootTargetType,
      rootTargetId,
    }),
    ({rootTargetType, rootTargetId}) => {
      const {endpoint, normalizationSchema} = rootTargetEndpointsByType[rootTargetType]
      return {
        endpoint: `${endpoint}/${rootTargetId}?include=justifications`,
        fetchInit: {
          method: httpMethods.GET,
        },
        normalizationSchema,
      }
    },
  ),

  fetchWritQuote: apiActionCreator(
    'FETCH_WRIT_QUOTE',
    (writQuoteId: EntityId) => ({writQuoteId}),
    payload => ({
      endpoint: `writ-quotes/${payload.writQuoteId}`,
      normalizationSchema: {writQuote: writQuoteSchema},
    }),
  ),
  createWritQuote: apiActionCreator(
    'CREATE_WRIT_QUOTE',
    (writQuote: WritQuote) => ({writQuote}),
    payload => ({
      endpoint: `writ-quotes`,
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
      normalizationSchema: {writQuote: writQuoteSchema},
    }),
  ),
  updateWritQuote: apiActionCreator(
    'UPDATE_WRIT_QUOTE',
    (writQuote: WritQuote) => ({writQuote}),
    payload => ({
      endpoint: `writ-quotes/${payload.writQuote.id}`,
      fetchInit: {
        method: httpMethods.PUT,
        body: payload,
      },
      normalizationSchema: {writQuote: writQuoteSchema},
    }),
  ),

  /** @deprecated */
  fetchSourceExcerptParaphrase: apiActionCreator(
    'FETCH_SOURCE_EXCERPT_PARAPHRASE',
    sourceExcerptParaphraseId => ({sourceExcerptParaphraseId}),
    payload => ({
      endpoint: `source-excerpt-paraphrases/${payload.sourceExcerptParaphraseId}`,
      normalizationSchema: {
        sourceExcerptParaphrase: sourceExcerptParaphraseSchema,
      },
    }),
  ),
  fetchPersorg: apiActionCreator(
    'FETCH_PERSORG',
    persorgId => ({
      persorgId,
    }),
    payload => ({
      endpoint: `persorgs/${payload.persorgId}`,
      normalizationSchema: {persorg: persorgSchema},
    }),
  ),
  fetchSpeakerStatements: apiActionCreator(
    'FETCH_PERSORG_STATEMENTS',
    speakerPersorgId => ({speakerPersorgId}),
    payload => ({
      endpoint: `statements?speakerPersorgId=${payload.speakerPersorgId}`,
      normalizationSchema: {statements: statementsSchema},
    }),
  ),
  fetchSentenceStatements: apiActionCreator(
    'FETCH_SENTENCE_STATEMENTS',
    (sentenceType, sentenceId) => ({sentenceType, sentenceId}),
    payload => ({
      endpoint: `statements?sentenceType=${payload.sentenceType}&sentenceId=${payload.sentenceId}`,
      normalizationSchema: {statements: statementsSchema},
    }),
  ),
  fetchRootPropositionStatements: apiActionCreator(
    'FETCH_ROOT_PROPOSITION_STATEMENTS',
    propositionId => ({propositionId}),
    payload => ({
      endpoint: `statements?rootPropositionId=${payload.propositionId}`,
      normalizationSchema: {statements: statementsSchema},
    }),
  ),
  fetchIndirectPropositionStatements: apiActionCreator(
    'FETCH_INDIRECT_PROPOSITION_STATEMENTS',
    propositionId => ({propositionId}),
    payload => ({
      endpoint: `statements?rootPropositionId=${payload.propositionId}&indirect`,
      normalizationSchema: {statements: statementsSchema},
    }),
  ),

  fetchRecentPropositions: apiActionCreator(
    'FETCH_RECENT_PROPOSITIONS',
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    }),
    payload => {
      const queryStringParams: ContinuationQueryStringParams = pick(payload, [
        'continuationToken',
        'count',
      ])
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts
      }
      const queryStringParamsString = queryString.stringify(queryStringParams)
      return {
        endpoint: 'propositions?' + queryStringParamsString,
        normalizationSchema: {propositions: propositionsSchema},
      }
    },
  ),
  fetchRecentWrits: apiActionCreator(
    'FETCH_RECENT_WRITS',
    (widgetId, count, continuationToken) => ({
      widgetId,
      continuationToken,
      count,
    }),
    payload => {
      const queryStringParams: ContinuationQueryStringParams = pick(payload, [
        'continuationToken',
        'count',
      ])
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts
      }
      const queryStringParamsString = queryString.stringify(queryStringParams)
      return {
        endpoint: 'writs?' + queryStringParamsString,
        normalizationSchema: {writs: writsSchema},
      }
    },
  ),
  fetchRecentWritQuotes: apiActionCreator(
    'FETCH_RECENT_WRIT_QUOTES',
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    }),
    payload => {
      const queryStringParams: ContinuationQueryStringParams = pick(payload, [
        'continuationToken',
        'count',
      ])
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts
      }
      const queryStringParamsString = queryString.stringify(queryStringParams)
      return {
        endpoint: 'writ-quotes?' + queryStringParamsString,
        normalizationSchema: {writQuotes: writQuotesSchema},
      }
    },
  ),
  fetchRecentJustifications: apiActionCreator(
    'FETCH_RECENT_JUSTIFICATIONS',
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    }),
    payload => {
      const queryStringParams: ContinuationQueryStringParams = pick(payload, [
        'continuationToken',
        'count',
      ])
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts
      }
      const queryStringParamsString = queryString.stringify(queryStringParams)
      return {
        endpoint: 'justifications?' + queryStringParamsString,
        normalizationSchema: {justifications: justificationsSchema},
      }
    },
  ),

  createAccountSettings: apiActionCreator(
    'CREATE_ACCOUNT_SETTINGS',
    accountSettings => ({accountSettings}),
    payload => ({
      endpoint: `account-settings`,
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
    }),
  ),
  fetchAccountSettings: apiActionCreator('FETCH_ACCOUNT_SETTINGS', undefined, {
    endpoint: `account-settings`,
    normalizationSchema: {
      accountSettings: accountSettingsSchema,
    },
  }),
  updateAccountSettings: apiActionCreator(
    'UPDATE_ACCOUNT_SETTINGS',
    accountSettings => ({accountSettings}),
    payload => ({
      endpoint: `account-settings`,
      fetchInit: {
        method: httpMethods.PUT,
        body: payload,
      },
      normalizationSchema: {accountSettings: accountSettingsSchema},
    }),
  ),

  createContentReport: apiActionCreator(
    'CREATE_CONTENT_REPORT',
    contentReport => ({contentReport}),
    payload => ({
      endpoint: `content-reports`,
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
    }),
  ),

  fetchJustificationsSearch: apiActionCreator(
    'FETCH_JUSTIFICATIONS_SEARCH',
    ({
      filters,
      includeUrls,
      sorts,
      count,
      continuationToken,
    }: {
      filters: JustificationSearchFilters
      includeUrls: boolean
      sorts: string
      count: number
      continuationToken: string
    }) => ({
      filters,
      includeUrls,
      sorts,
      count,
      continuationToken,
    }),
    payload => {
      const {filters, includeUrls, sorts, count, continuationToken} = payload
      const params: JustificationSearchQueryStringParams = {}

      if (!isEmpty(filters)) {
        params.filters = encodeQueryStringObject(filters)
      }

      if (!isEmpty(includeUrls)) {
        params.includeUrls = includeUrls.toString()
      }

      if (!isEmpty(sorts)) {
        params.sorts = encodeQueryStringObject(sorts)
      } else {
        params.sorts = defaultSorts
      }

      if (count) {
        params.count = count
      }

      if (continuationToken) {
        params.continuationToken = continuationToken
      }

      return {
        endpoint: 'justifications?' + queryString.stringify(params),
        normalizationSchema: {justifications: justificationsSchema},
      }
    },
  ),
  login: apiActionCreator(
    'LOGIN',
    credentials => ({credentials}),
    payload => ({
      endpoint: 'login',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
      normalizationSchema: {user: userSchema},
    }),
  ),
  logout: apiActionCreator('LOGOUT', () => ({}), {
    endpoint: 'logout',
    fetchInit: {
      method: httpMethods.POST,
    },
  }),

  requestPasswordReset: apiActionCreator(
    'REQUEST_PASSWORD_RESET',
    passwordResetRequest => ({passwordResetRequest}),
    payload => ({
      endpoint: 'password-reset-requests',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
    }),
  ),
  checkPasswordResetRequest: apiActionCreator(
    'CHECK_PASSWORD_RESET_REQUEST',
    passwordResetCode => ({passwordResetCode}),
    payload => {
      const queryStringParams = pick(payload, ['passwordResetCode'])
      const queryStringParamsString = queryString.stringify(queryStringParams)
      return {
        endpoint: `password-reset-requests?${queryStringParamsString}`,
      }
    },
  ),
  confirmPasswordReset: apiActionCreator(
    'CONFIRM_PASSWORD_RESET',
    (passwordResetCode, passwordResetConfirmation) => ({
      passwordResetCode,
      passwordResetConfirmation,
    }),
    payload => ({
      endpoint: 'password-resets',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
    }),
  ),

  requestRegistration: apiActionCreator(
    'REQUEST_REGISTRATION',
    registrationRequest => ({registrationRequest}),
    payload => ({
      endpoint: 'registration-requests',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
    }),
  ),
  checkRegistration: apiActionCreator(
    'CHECK_REGISTRATION',
    registrationCode => ({registrationCode}),
    payload => {
      const queryStringParams = pick(payload, ['registrationCode'])
      const queryStringParamsString = queryString.stringify(queryStringParams)
      return {
        endpoint: `registration-requests?${queryStringParamsString}`,
      }
    },
  ),
  confirmRegistration: apiActionCreator(
    'CONFIRM_REGISTRATION',
    registrationConfirmation => ({registrationConfirmation}),
    payload => ({
      endpoint: 'registrations',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
    }),
  ),

  verifyJustification: apiActionCreator(
    'VERIFY_JUSTIFICATION',
    justification => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      },
      previousJustificationVote: justification.vote,
    }),
    payload => ({
      endpoint: 'justification-votes',
      fetchInit: {
        method: httpMethods.POST,
        body: {
          justificationVote: payload.justificationVote,
        },
      },
      normalizationSchema: {justificationVote: justificationVoteSchema},
    }),
  ),
  unVerifyJustification: apiActionCreator(
    'UN_VERIFY_JUSTIFICATION',
    justification => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      },
      previousJustificationVote: justification.vote,
    }),
    payload => ({
      endpoint: 'justification-votes',
      fetchInit: {
        method: httpMethods.DELETE,
        body: {
          justificationVote: payload.justificationVote,
        },
      },
    }),
  ),
  disverifyJustification: apiActionCreator(
    'DISVERIFY_JUSTIFICATION',
    justification => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.NEGATIVE,
      },
      previousJustificationVote: justification.vote,
    }),
    payload => ({
      endpoint: 'justification-votes',
      fetchInit: {
        method: httpMethods.POST,
        body: {
          justificationVote: payload.justificationVote,
        },
      },
      normalizationSchema: {justificationVote: justificationVoteSchema},
    }),
  ),
  unDisverifyJustification: apiActionCreator(
    'UN_DISVERIFY_JUSTIFICATION',
    justification => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.NEGATIVE,
      },
      previousJustificationVote: justification.vote,
    }),
    payload => ({
      endpoint: 'justification-votes',
      fetchInit: {
        method: httpMethods.DELETE,
        body: {
          justificationVote: payload.justificationVote,
        },
      },
    }),
  ),

  createTag: apiActionCreator('CREATE_TAG', (tagTagetType, tagTargetId, tag, tagVote) => ({
    tagTagetType,
    tagTargetId,
    tag,
    tagVote,
  })),
  createAntiTag: apiActionCreator('CREATE_ANTI_TAG', (tagTagetType, tagTargetId, tag, tagVote) => ({
    tagTagetType,
    tagTargetId,
    tag,
    tagVote,
  })),
  unTag: apiActionCreator('UN_TAG', tagVote => ({tagVote})),

  tagProposition: apiActionCreator(
    'TAG_PROPOSITION',
    (propositionId: EntityId, tag: Tag, propositionTagVote: PropositionTagVote) => ({
      propositionTagVote: makePropositionTagVoteSubmissionModel({
        polarity: PropositionTagVotePolarities.POSITIVE,
        proposition: {id: propositionId},
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    }),
    payload => ({
      endpoint: 'proposition-tag-votes',
      fetchInit: {
        method: httpMethods.POST,
        body: {
          propositionTagVote: payload.propositionTagVote,
        },
      },
      normalizationSchema: {propositionTagVote: propositionTagVoteSchema},
    }),
  ),
  antiTagProposition: apiActionCreator(
    'ANTI_TAG_PROPOSITION',
    (propositionId, tag, propositionTagVote) => ({
      propositionTagVote: makePropositionTagVoteSubmissionModel({
        polarity: PropositionTagVotePolarities.NEGATIVE,
        proposition: {id: propositionId},
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    }),
    payload => ({
      endpoint: 'proposition-tag-votes',
      fetchInit: {
        method: httpMethods.POST,
        body: {
          propositionTagVote: payload.propositionTagVote,
        },
      },
      normalizationSchema: {propositionTagVote: propositionTagVoteSchema},
    }),
  ),
  unTagProposition: apiActionCreator(
    'UN_TAG_PROPOSITION',
    (propositionTagVote: Persisted<PropositionTagVote>) => ({
      prevPropositionTagVote: propositionTagVote,
    }),
    payload => ({
      endpoint: `proposition-tag-votes/${payload.prevPropositionTagVote.id}`,
      fetchInit: {
        method: httpMethods.DELETE,
      },
    }),
  ),

  createProposition: apiActionCreator(
    'CREATE_PROPOSITION',
    proposition => ({
      proposition,
    }),
    payload => ({
      endpoint: 'propositions',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
      normalizationSchema: {proposition: propositionSchema},
    }),
  ),
  updateProposition: apiActionCreator(
    'UPDATE_PROPOSITION',
    (proposition: Proposition) => ({proposition}),
    payload => ({
      endpoint: `propositions/${payload.proposition.id}`,
      normalizationSchema: {proposition: propositionSchema},
      fetchInit: {
        method: httpMethods.PUT,
        body: {
          proposition: decircularizeProposition(payload.proposition),
        },
      },
    }),
  ),
  deleteProposition: apiActionCreator(
    'DELETE_PROPOSITION',
    proposition => ({
      proposition,
    }),
    payload => ({
      endpoint: `propositions/${payload.proposition.id}`,
      fetchInit: {
        method: httpMethods.DELETE,
      },
    }),
  ),

  createStatement: apiActionCreator(
    'CREATE_STATEMENT',
    statement => ({statement}),
    payload => ({
      endpoint: 'statements',
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
      normalizationSchema: {statement: statementSchema},
    }),
  ),

  updatePersorg: apiActionCreator(
    'UPDATE_PERSORG',
    persorg => ({persorg}),
    payload => ({
      endpoint: `persorgs/${payload.persorg.id}`,
      normalizationSchema: {persorg: persorgSchema},
      fetchInit: {
        method: httpMethods.PUT,
        body: payload,
      },
    }),
  ),

  fetchPropositionTextSuggestions: apiActionCreator(
    'FETCH_PROPOSITION_TEXT_SUGGESTIONS',
    (propositionText, suggestionsKey) => ({
      propositionText,
      suggestionsKey,
    }),
    payload => ({
      endpoint: `search-propositions?${queryString.stringify({
        searchText: payload.propositionText,
      })}`,
      cancelKey:
        makeApiActionTypes('FETCH_PROPOSITION_TEXT_SUGGESTIONS')[0] + '.' + payload.suggestionsKey,
      normalizationSchema: propositionsSchema,
    }),
  ),

  fetchWritTitleSuggestions: apiActionCreator(
    'FETCH_WRIT_TITLE_SUGGESTIONS',
    (writTitle, suggestionsKey) => ({
      writTitle,
      suggestionsKey,
    }),
    payload => ({
      endpoint: `search-writs?${queryString.stringify({
        searchText: payload.writTitle,
      })}`,
      cancelKey:
        makeApiActionTypes('FETCH_WRIT_TITLE_SUGGESTIONS')[0] + '.' + payload.suggestionsKey,
      normalizationSchema: writsSchema,
    }),
  ),

  fetchTagNameSuggestions: apiActionCreator(
    'FETCH_TAG_NAME_SUGGESTIONS',
    (tagName, suggestionsKey) => ({
      tagName,
      suggestionsKey,
    }),
    payload => ({
      endpoint: `search-tags?${queryString.stringify({
        searchText: payload.tagName,
      })}`,
      cancelKey: makeApiActionTypes('FETCH_TAG_NAME_SUGGESTIONS')[0] + '.' + payload.suggestionsKey,
      normalizationSchema: tagsSchema,
    }),
  ),

  fetchMainSearchSuggestions: apiActionCreator(
    'FETCH_MAIN_SEARCH_SUGGESTIONS',
    (searchText, suggestionsKey) => ({
      searchText,
      suggestionsKey,
    }),
    payload => ({
      endpoint: `search?${queryString.stringify({
        searchText: payload.searchText,
      })}`,
      cancelKey:
        makeApiActionTypes('FETCH_MAIN_SEARCH_SUGGESTIONS')[0] + '.' + payload.suggestionsKey,
      normalizationSchema: mainSearchResultsSchema,
    }),
  ),

  fetchPersorgNameSuggestions: apiActionCreator(
    'FETCH_PERSORG_NAME_SUGGESTIONS',
    (searchText, suggestionsKey) => ({
      searchText,
      suggestionsKey,
    }),
    payload => ({
      endpoint: `search-persorgs?${queryString.stringify({
        searchText: payload.searchText,
      })}`,
      cancelKey: `${makeApiActionTypes('FETCH_PERSORG_NAME_SUGGESTIONS')[0]}.${
        payload.suggestionsKey
      }`,
      normalizationSchema: persorgsSchema,
    }),
  ),

  createJustification: apiActionCreator(
    'CREATE_JUSTIFICATION',
    justification => ({justification}),
    payload => ({
      endpoint: 'justifications',
      fetchInit: {
        method: httpMethods.POST,
        body: {
          justification: decircularizeJustification(payload.justification),
        },
      },
      normalizationSchema: {justification: justificationSchema},
    }),
  ),
  deleteJustification: apiActionCreator(
    'DELETE_JUSTIFICATION',
    justification => ({justification}),
    payload => ({
      endpoint: `justifications/${payload.justification.id}`,
      fetchInit: {
        method: httpMethods.DELETE,
      },
    }),
  ),

  fetchMainSearchResults: apiActionCreator(
    'FETCH_MAIN_SEARCH_RESULTS',
    searchText => ({searchText}),
    payload => ({
      endpoint: `search?${queryString.stringify({
        searchText: payload.searchText,
      })}`,
      normalizationSchema: mainSearchResultsSchema,
    }),
  ),

  fetchTag: apiActionCreator(
    'FETCH_TAG',
    tagId => ({tagId}),
    payload => ({
      endpoint: `tags/${payload.tagId}`,
      normalizationSchema: {tag: tagSchema},
    }),
  ),
  fetchTaggedPropositions: apiActionCreator(
    'FETCH_TAGGED_PROPOSITIONS',
    tagId => ({tagId}),
    payload => ({
      endpoint: `propositions?tagId=${payload.tagId}`,
      normalizationSchema: {propositions: propositionsSchema},
    }),
  ),
}

export const cancelPersorgNameSuggestions = createAction(
  'CANCEL_PERSORG_NAME_SUGGESTIONS',
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes('FETCH_PERSORG_NAME_SUGGESTIONS')[0],
    cancelTargetArgs: ['', suggestionsKey],
    suggestionsKey,
  }),
)
export const cancelMainSearchSuggestions = createAction(
  'CANCEL_MAIN_SEARCH_SUGGESTIONS',
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes('FETCH_MAIN_SEARCH_SUGGESTIONS')[0],
    cancelTargetArgs: ['', suggestionsKey],
    suggestionsKey,
  }),
)
export const cancelTagNameSuggestions = createAction(
  'CANCEL_TAG_NAME_SUGGESTIONS',
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes('FETCH_TAG_NAME_SUGGESTIONS')[0],
    cancelTargetArgs: ['', suggestionsKey],
    suggestionsKey,
  }),
)
export const cancelWritTitleSuggestions = createAction(
  'CANCEL_WRIT_TITLE_SUGGESTIONS',
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes('FETCH_WRIT_TITLE_SUGGESTIONS')[0],
    cancelTargetArgs: ['', suggestionsKey],
    suggestionsKey,
  }),
)
export const cancelPropositionTextSuggestions = createAction(
  'CANCEL_PROPOSITION_TEXT_SUGGESTIONS',
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes('FETCH_PROPOSITION_TEXT_SUGGESTIONS')[0],
    cancelTargetArgs: ['', suggestionsKey],
    suggestionsKey,
  }),
)

type UnknownApiActionCreator = ApiActionCreator<unknown, unknown, void | PrepareAction<unknown>>

export const apiActionCreatorsByActionType = reduce(
  api,
  (result: {[key: string]: UnknownApiActionCreator}, actionCreator) => {
    result[str(actionCreator)] = actionCreator as any
    return result
  },
  {},
)
