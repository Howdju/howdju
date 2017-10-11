import isEmpty from 'lodash/isEmpty'
import join from 'lodash/join'
import pick from 'lodash/pick'
import queryString from 'query-string'

import {
  SortDirection,
  encodeQueryStringObject,
  httpMethods,
} from 'howdju-common'

import {
  api,
  str,
} from "../actions"
import {
  justificationSchema,
  justificationsSchema,
  justificationBasisCompoundSchema,
  justificationVoteSchema,
  mainSearchResultsSchema,
  perspectivesSchema,
  sourceExcerptParaphraseSchema,
  statementSchema,
  statementsSchema,
  statementCompoundSchema,
  statementJustificationsSchema,
  statementTagVoteSchema,
  tagsSchema,
  writQuoteSchema,
  writsSchema,
  writQuotesSchema,
  tagSchema,
} from '../schemas'


const defaultSorts = `created=${SortDirection.DESCENDING}`

export const resourceApiConfigs = {

  /* Entity CRUD */

  [api.fetchStatements]: (payload) => {
    const query = payload.statementIds ?
      `?statementIds=${join(payload.statementIds, ',')}` :
      ''
    return {
      endpoint: `statements${query}`,
      schema: {statements: statementsSchema},
    }
  },
  [api.fetchStatement]: (payload) => ({
    endpoint: `statements/${payload.statementId}`,
    schema: {statement: statementSchema},
  }),
  [api.fetchStatementCompound]: (payload) => ({
    endpoint: `statement-compounds/${payload.statementCompoundId}`,
    schema: {statementCompound: statementCompoundSchema},
  }),
  [api.fetchSourceExcerptParaphrase]: (payload) => ({
    endpoint: `source-excerpt-paraphrases/${payload.sourceExcerptParaphraseId}`,
    schema: {sourceExcerptParaphrase: sourceExcerptParaphraseSchema},
  }),
  [api.fetchJustificationBasisCompound]: (payload) => ({
    endpoint: `justification-basis-compounds/${payload.justificationBasisCompoundId}`,
    schema: {justificationBasisCompound: justificationBasisCompoundSchema},
  }),
  [api.fetchWritQuote]: (payload) => ({
    endpoint: `writ-quotes/${payload.writQuoteId}`,
    schema: {writQuote: writQuoteSchema},
  }),
  [api.updateWritQuote]: (payload) => ({
    endpoint: `writ-quotes/${payload.writQuote.id}`,
    fetchInit: {
      method: httpMethods.PUT,
      body: payload
    },
    schema: {writQuote: writQuoteSchema},
  }),
  [api.createStatement]: (payload) => ({
    endpoint: 'statements',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {statement: statementSchema}
  }),
  [api.updateStatement]: (payload) => ({
    endpoint: `statements/${payload.statement.id}`,
    schema: {statement: statementSchema},
    fetchInit: {
      method: httpMethods.PUT,
      body: {
        statement: payload.statement
      }
    },
  }),
  [api.createJustification]: (payload) => ({
    endpoint: 'justifications',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {justification: justificationSchema}
  }),
  [api.deleteStatement]: (payload) => ({
    endpoint: `statements/${payload.statement.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    },
  }),
  [api.deleteJustification]: (payload) => ({
    endpoint: `justifications/${payload.justification.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    },
  }),
  [api.fetchTag]: (payload) => ({
    endpoint: `tags/${payload.tagId}`,
    schema: {tag: tagSchema}
  }),

  /* Recents */

  [api.fetchRecentStatements]: (payload) => {
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
  [api.fetchRecentWrits]: (payload) => {
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
  [api.fetchRecentWritQuotes]: (payload) => {
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
  [api.fetchRecentJustifications]: (payload) => {
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

  /* Pages */

  [api.fetchFeaturedPerspectives]: (payload) => ({
    endpoint: 'perspectives?featured',
    schema: {perspectives: perspectivesSchema},
    requiresRehydrate: true,
  }),

  [api.fetchStatementJustifications]: (payload) => ({
    endpoint: `statements/${payload.statementId}?include=justifications`,
    fetchInit: {
      method: httpMethods.GET,
    },
    schema: statementJustificationsSchema,
    requiresRehydrate: true
  }),

  [api.fetchTaggedStatements]: (payload) => ({
    endpoint: `statements?tagId=${payload.tagId}`,
    schema: {statements: statementsSchema},
    requiresRehydrate: true,
  }),

  /* Auth */

  [api.login]: (payload) => ({
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

  /* Votes */

  [api.verifyJustification]: (payload) => ({
    endpoint: 'justification-votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        justificationVote: payload.justificationVote
      }
    },
    schema: {justificationVote: justificationVoteSchema},
  }),
  [api.unVerifyJustification]: (payload) => ({
    endpoint: 'justification-votes',
    fetchInit: {
      method: httpMethods.DELETE,
      body: {
        justificationVote: payload.justificationVote
      }
    },
  }),
  [api.disverifyJustification]: (payload) => ({
    endpoint: 'justification-votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        justificationVote: payload.justificationVote
      }
    },
    schema: {justificationVote: justificationVoteSchema},
  }),
  [api.unDisverifyJustification]: (payload) => ({
    endpoint: 'justification-votes',
    fetchInit: {
      method: httpMethods.DELETE,
      body: {
        justificationVote: payload.justificationVote
      }
    },
  }),

  [api.tagStatement]: (payload) => ({
    endpoint: 'statement-tag-votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        statementTagVote: payload.statementTagVote
      }
    },
    schema: {statementTagVote: statementTagVoteSchema},
  }),
  [api.antiTagStatement]: (payload) => ({
    endpoint: 'statement-tag-votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        statementTagVote: payload.statementTagVote
      }
    },
    schema: {statementTagVote: statementTagVoteSchema},
  }),
  [api.unTagStatement]: (payload) => ({
    endpoint: `statement-tag-votes/${payload.prevStatementTagVote.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    }
  }),

  /* Suggestions / full-text search */

  [api.fetchStatementTextSuggestions]: (payload) => ({
    endpoint: `search-statements?searchText=${payload.statementText}`,
    cancelKey: str(api.fetchStatementTextSuggestions) + '.' + payload.suggestionsKey,
    schema: statementsSchema,
  }),
  [api.fetchTagNameSuggestions]: (payload) => ({
    endpoint: `search-tags?searchText=${payload.tagName}`,
    cancelKey: str(api.fetchTagNameSuggestions) + '.' + payload.suggestionsKey,
    schema: tagsSchema,
  }),
  [api.fetchWritTitleSuggestions]: (payload) => ({
    endpoint: `search-writs?searchText=${payload.writTitle}`,
    cancelKey: str(api.fetchWritTitleSuggestions) + '.' + payload.suggestionsKey,
    schema: writsSchema,
  }),

  [api.fetchMainSearchResults]: (payload) => ({
    endpoint: `search?searchText=${payload.searchText}`,
    schema: mainSearchResultsSchema,
  }),
  [api.fetchMainSearchSuggestions]: (payload) => ({
    endpoint: `search?searchText=${payload.searchText}`,
    cancelKey: str(api.fetchMainSearchSuggestions) + '.' + payload.suggestionsKey,
    schema: mainSearchResultsSchema,
  }),

  /* Justification search */

  [api.fetchJustificationsSearch]: (payload) => {
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
}
