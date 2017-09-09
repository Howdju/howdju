const {
  database
} = require('./databaseInitialization')
const {
  makeStatementTextSearcher,
  makeWritingTitleSearcher,
} = require('howdju-service-common')

exports.statementsTextSearcher = makeStatementTextSearcher(database)
exports.writingsTitleSearcher = makeWritingTitleSearcher(database)
