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
  propositionSchema,
  propositionsSchema,
  propositionCompoundSchema,
  propositionJustificationsSchema,
  propositionTagVoteSchema,
  tagsSchema,
  writQuoteSchema,
  writsSchema,
  writQuotesSchema,
  tagSchema,
} from '../schemas'


const defaultSorts = `created=${SortDirection.DESCENDING}`

export const resourceApiConfigs = {

  /* Entity CRUD */

  [api.fetchPropositions]: (payload) => {
    const query = payload.propositionIds ?
      `?propositionIds=${join(payload.propositionIds, ',')}` :
      ''
    return {
      endpoint: `propositions${query}`,
      schema: {propositions: propositionsSchema},
    }
  },
  [api.fetchProposition]: (payload) => ({
    endpoint: `propositions/${payload.propositionId}`,
    schema: {proposition: propositionSchema},
  }),
  [api.fetchPropositionCompound]: (payload) => ({
    endpoint: `proposition-compounds/${payload.propositionCompoundId}`,
    schema: {propositionCompound: propositionCompoundSchema},
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
  [api.createProposition]: (payload) => ({
    endpoint: 'propositions',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {proposition: propositionSchema}
  }),
  [api.updateProposition]: (payload) => ({
    endpoint: `propositions/${payload.proposition.id}`,
    schema: {proposition: propositionSchema},
    fetchInit: {
      method: httpMethods.PUT,
      body: {
        proposition: payload.proposition
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
  [api.deleteProposition]: (payload) => ({
    endpoint: `propositions/${payload.proposition.id}`,
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

  [api.fetchRecentPropositions]: (payload) => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    if (!queryStringParams.continuationToken) {
      queryStringParams.sorts = defaultSorts
    }
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'propositions?' + queryStringParamsString,
      schema: {propositions: propositionsSchema},
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

  [api.fetchPropositionJustifications]: (payload) => ({
    endpoint: `propositions/${payload.propositionId}?include=justifications`,
    fetchInit: {
      method: httpMethods.GET,
    },
    schema: propositionJustificationsSchema,
    requiresRehydrate: true
  }),

  [api.fetchTaggedPropositions]: (payload) => ({
    endpoint: `propositions?tagId=${payload.tagId}`,
    schema: {propositions: propositionsSchema},
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

  [api.tagProposition]: (payload) => ({
    endpoint: 'proposition-tag-votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        propositionTagVote: payload.propositionTagVote
      }
    },
    schema: {propositionTagVote: propositionTagVoteSchema},
  }),
  [api.antiTagProposition]: (payload) => ({
    endpoint: 'proposition-tag-votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        propositionTagVote: payload.propositionTagVote
      }
    },
    schema: {propositionTagVote: propositionTagVoteSchema},
  }),
  [api.unTagProposition]: (payload) => ({
    endpoint: `proposition-tag-votes/${payload.prevPropositionTagVote.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    }
  }),

  /* Suggestions / full-text search */

  [api.fetchPropositionTextSuggestions]: (payload) => ({
    endpoint: `search-propositions?searchText=${payload.propositionText}`,
    cancelKey: str(api.fetchPropositionTextSuggestions) + '.' + payload.suggestionsKey,
    schema: propositionsSchema,
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
