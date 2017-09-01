const {
  database
} = require('./databaseInitialization')
const {
  makeStatementTextSearcher,
  makeCitationTextSearcher,
} = require('howdju-service-common')

exports.statementsTextSearcher = makeStatementTextSearcher(database)
exports.citationsTextSearcher = makeCitationTextSearcher(database)
