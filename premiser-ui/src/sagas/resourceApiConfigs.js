import isEmpty from 'lodash/isEmpty'
import pick from 'lodash/pick'
import queryString from 'query-string'

import {
  SortDirection,
  encodeQueryStringObject,
} from 'howdju-common'

import {
  api,
  str,
} from "../actions"
import {
  statementJustificationsSchema,
  voteSchema,
  statementSchema,
  justificationSchema,
  writQuoteSchema,
  statementsSchema,
  statementCompoundSchema,
  perspectivesSchema,
  writsSchema,
  justificationsSchema,
  writQuotesSchema, justificationBasisCompoundSchema, sourceExcerptParaphraseSchema,
} from '../schemas'
import * as httpMethods from '../httpMethods'

const defaultSorts = `created=${SortDirection.DESCENDING}`

export const resourceApiConfigs = {
  [api.fetchStatements]: {
    endpoint: 'statements',
    schema: {statements: statementsSchema},
  },
  [api.fetchRecentStatements]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    if (!queryStringParams.continuationToken) {
      queryStringParams.sorts = defaultSorts
    }
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'statements?' + queryStringParamsString,
      schema: {statements: statementsSchema},
    }
  },
  [api.fetchRecentWrits]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    if (!queryStringParams.continuationToken) {
      queryStringParams.sorts = defaultSorts
    }
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'writs?' + queryStringParamsString,
      schema: {writs: writsSchema},
    }
  },
  [api.fetchRecentWritQuotes]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    if (!queryStringParams.continuationToken) {
      queryStringParams.sorts = defaultSorts
    }
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'writ-quotes?' + queryStringParamsString,
      schema: {writQuotes: writQuotesSchema},
    }
  },
  [api.fetchRecentJustifications]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    if (!queryStringParams.continuationToken) {
      queryStringParams.sorts = defaultSorts
    }
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'justifications?' + queryStringParamsString,
      schema: {justifications: justificationsSchema},
    }
  },
  [api.fetchJustificationsSearch]: payload => {
    const {
      filters,
      sorts,
      count,
      continuationToken
    } = payload
    const params = {}

    if (!isEmpty(filters)) {
      params.filters = encodeQueryStringObject(filters)
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
      schema: {justifications: justificationsSchema},
    }
  },
  [api.fetchFeaturedPerspectives]: payload => ({
    endpoint: 'perspectives?featured',
    schema: {perspectives: perspectivesSchema},
    requiresRehydrate: true,
  }),
  [api.fetchStatement]: payload => ({
    endpoint: `statements/${payload.statementId}`,
    schema: {statement: statementSchema},
  }),
  [api.fetchStatementCompound]: payload => ({
    endpoint: `statement-compounds/${payload.statementCompoundId}`,
    schema: {statementCompound: statementCompoundSchema},
  }),
  [api.fetchSourceExcerptParaphrase]: payload => ({
    endpoint: `source-excerpt-paraphrases/${payload.sourceExcerptParaphraseId}`,
    schema: {sourceExcerptParaphrase: sourceExcerptParaphraseSchema},
  }),
  [api.fetchJustificationBasisCompound]: payload => ({
    endpoint: `justification-basis-compounds/${payload.justificationBasisCompoundId}`,
    schema: {justificationBasisCompound: justificationBasisCompoundSchema},
  }),
  [api.fetchWritQuote]: payload => ({
    endpoint: `writ-quotes/${payload.writQuoteId}`,
    schema: {writQuote: writQuoteSchema},
  }),
  [api.updateWritQuote]: payload => ({
    endpoint: `writ-quotes/${payload.writQuote.id}`,
    fetchInit: {
      method: httpMethods.PUT,
      body: payload
    },
    schema: {writQuote: writQuoteSchema},
  }),
  [api.createStatement]: payload => ({
    endpoint: 'statements',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {statement: statementSchema}
  }),
  [api.updateStatement]: payload => ({
    endpoint: `statements/${payload.statement.id}`,
    schema: {statement: statementSchema},
    fetchInit: {
      method: httpMethods.PUT,
      body: {
        statement: payload.statement
      }
    },
  }),
  [api.createJustification]: payload => ({
    endpoint: 'justifications',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {justification: justificationSchema}
  }),
  [api.deleteStatement]: payload => ({
    endpoint: `statements/${payload.statement.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    },
  }),
  [api.deleteJustification]: payload => ({
    endpoint: `justifications/${payload.justification.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    },
  }),
  [api.login]: payload => ({
    endpoint: 'login',
    fetchInit: {
      method: httpMethods.POST,
      body: payload,
    }
  }),
  [api.logout]: {
    endpoint: 'logout',
    fetchInit: {
      method: httpMethods.POST,
    }
  },
  [api.fetchStatementJustifications]: payload => ({
    endpoint: `statements/${payload.statementId}?include=justifications`,
    fetchInit: {
      method: httpMethods.GET,
    },
    schema: statementJustificationsSchema,
    requiresRehydrate: true
  }),
  [api.fetchStatementsSearch]: payload => ({
    endpoint: `search-statements?searchText=${payload.searchText}`,
    schema: statementsSchema,
  }),
  [api.verifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.unVerifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.DELETE,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.disverifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.unDisverifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.DELETE,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.fetchStatementTextSuggestions]: payload => ({
    endpoint: `search-statements?searchText=${payload.statementText}`,
    cancelKey: str(api.fetchStatementTextSuggestions) + '.' + payload.suggestionsKey,
    schema: statementsSchema,
  }),
  [api.fetchWritTitleSuggestions]: payload => ({
    endpoint: `search-writs?searchText=${payload.writTitle}`,
    cancelKey: str(api.fetchWritTitleSuggestions) + '.' + payload.suggestionsKey,
    schema: writsSchema,
  }),
  [api.fetchMainSearchSuggestions]: payload => ({
    endpoint: `search-statements?searchText=${payload.searchText}`,
    cancelKey: str(api.fetchMainSearchSuggestions) + '.' + payload.suggestionsKey,
    schema: statementsSchema,
  })
}
