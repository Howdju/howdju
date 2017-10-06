const {
  toStatement,
  toWrit,
  toWritQuote,
} = require('../daos/orm')

const {TextSearcher} = require('./TextSearcher')

module.exports = {
  makeStatementTextSearcher: (database) => new TextSearcher(database, 'statements', 'text', toStatement, 'statement_id'),
  makeWritTitleSearcher: (database) => new TextSearcher(database, 'writs', 'title', toWrit, 'writ_id'),
  makeWritQuoteQuoteTextSearcher: (database) => new TextSearcher(database, 'writ_quotes', 'quote_text', toWritQuote, 'writ_quote_id'),
}
