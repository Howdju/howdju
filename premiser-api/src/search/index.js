const {
  toStatement,
  toCitation,
} = require('howdju-service-common')

const TextSearcher = require('./TextSearcher')

module.exports = {
  statementTextSearcher: new TextSearcher('statements', 'text', toStatement, 'statement_id'),
  citationTextSearcher: new TextSearcher('citations', 'text', toCitation, 'citation_id'),
}
