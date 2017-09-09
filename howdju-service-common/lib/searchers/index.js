const {
  toStatement,
  toWriting,
} = require('../daos/orm')

const TextSearcher = require('./TextSearcher')

module.exports = {
  makeStatementTextSearcher: (database) => new TextSearcher(database, 'statements', 'text', toStatement, 'statement_id'),
  makeWritingTitleSearcher: (database) => new TextSearcher(database, 'writings', 'title', toWriting, 'writing_id'),
}
