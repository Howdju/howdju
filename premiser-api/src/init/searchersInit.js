const assign = require('lodash/assign')

const {
  makePropositionTextSearcher,
  makeWritTitleSearcher,
  makeWritQuoteQuoteTextSearcher,
  makePersorgsNameSearcher,
} = require('howdju-service-common')

exports.init = function init(provider) {
  assign(provider, {
    propositionsTextSearcher: makePropositionTextSearcher(provider.database),
    writsTitleSearcher: makeWritTitleSearcher(provider.database),
    writQuotesQuoteTextSearcher: makeWritQuoteQuoteTextSearcher(provider.database),
    persorgsNameSearcher: makePersorgsNameSearcher(provider.database),
  })
}
