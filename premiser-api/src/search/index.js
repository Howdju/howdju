const TextSearcher = require('./TextSearcher')
const {
  toStatement,
  toCitation,
} = require('../orm')

module.exports = {
  statementTextSearcher: new TextSearcher('statements', 'text', toStatement, 'statement_id'),
  citationTextSearcher: new TextSearcher('citations', 'text', toCitation, 'citation_id'),
}
