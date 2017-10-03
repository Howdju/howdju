const Promise = require('bluebird')
const map = require('lodash/map')
const sumBy = require('lodash/sumBy')

const {logger} = require('howdju-ops')
const {normalizeText} = require("howdju-service-common/lib/daos/util")

const {AppProvider} = require('../src/init')


const appProvider = new AppProvider()
const {database, pool} = appProvider

Promise.all([
  updateNormalText('select * from statements', updateStatementRowNormalText, 'statements'),
  updateNormalText('select * from writs', updateWritRowNormalTitle, 'writs'),
  updateNormalText('select * from writ_quotes', updateWritQuoteRowNormalQuoteText, 'writ quotes'),
])
  .finally(() => pool.end())

function updateNormalText(rowsQuery, updateRowFn, rowDescription) {
  return database.query(rowsQuery)
    .then( ({rows}) => Promise.all(map(rows, updateRowFn)))
    .then( (updates) => {
      const count = sumBy(updates, update => update.rows.length)
      logger.info(`Updated ${count} ${rowDescription}`)
      return count
    })
    .catch( (error) => logger.error(error))
}

function updateStatementRowNormalText (row) {
  return database.query(
    'update statements set normal_text = $1 where statement_id = $2 returning *',
    [normalizeText(row.text), row.statement_id]
  )
}

function updateWritRowNormalTitle(row) {
  return database.query(
    'update writs set normal_title = $1 where writ_id = $2 returning *',
    [normalizeText(row.title), row.writ_id]
  )
}

function updateWritQuoteRowNormalQuoteText(row) {
  return database.query(
    'update writ_quotes set normal_quote_text = $1 where writ_quote_id = $2 returning *',
    [normalizeText(row.quote_text), row.writ_quote_id]
  )
}
