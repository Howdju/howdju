const {
  toStatement,
  toCitation,
} = require('../daos/orm')

const TextSearcher = require('./TextSearcher')

module.exports = {
  makeStatementTextSearcher: (database) => new TextSearcher(database, 'statements', 'text', toStatement, 'statement_id'),
  makeCitationTextSearcher: (database) => new TextSearcher(database, 'citations', 'text', toCitation, 'citation_id'),
}
