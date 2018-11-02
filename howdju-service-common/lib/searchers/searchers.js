const {
  toProposition,
  toWrit,
  toWritQuote,
  toPersorg,
} = require('../daos/orm')

const {TextSearcher} = require('./TextSearcher')

module.exports = {
  makePropositionTextSearcher: (database) => new TextSearcher(database, 'propositions', 'text', toProposition, 'proposition_id'),
  makeWritTitleSearcher: (database) => new TextSearcher(database, 'writs', 'title', toWrit, 'writ_id'),
  makeWritQuoteQuoteTextSearcher: (database) => new TextSearcher(database, 'writ_quotes', 'quote_text', toWritQuote, 'writ_quote_id'),
  makePersorgsNameSearcher: (database) => new TextSearcher(database, 'persorgs', 'name', toPersorg, 'persorg_id'),
}
