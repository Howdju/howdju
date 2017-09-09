const {
  database
} = require('./databaseInitialization')
const {
  makeStatementTextSearcher,
  makeWritTitleSearcher,
} = require('howdju-service-common')

exports.statementsTextSearcher = makeStatementTextSearcher(database)
exports.writsTitleSearcher = makeWritTitleSearcher(database)
