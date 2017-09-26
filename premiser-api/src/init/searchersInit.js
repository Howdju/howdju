const assign = require('lodash/assign')

const {
  makeStatementTextSearcher,
  makeWritTitleSearcher,
} = require('howdju-service-common')

exports.init = function init(provider) {
  assign(provider, {
    statementsTextSearcher: makeStatementTextSearcher(provider.database),
    writsTitleSearcher: makeWritTitleSearcher(provider.database),
  })
}
