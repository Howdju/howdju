const Promise = require('bluebird')
const map = require('lodash/map')
const sumBy = require('lodash/sumBy')

const {logger} = require('howdju-ops')
const {normalizeText} = require("howdju-service-common/lib/daos/util")

const {AppProvider} = require('../src/init')


const appProvider = new AppProvider()
const {database, pool} = appProvider

run()

function run() {
  return Promise.all([
    updateNormalText('select * from propositions', updatePropositionRowNormalText, 'propositions'),
    updateNormalText('select * from writs', updateWritRowNormalTitle, 'writs'),
    updateNormalText('select * from writ_quotes', updateWritQuoteRowNormalQuoteText, 'writ quotes'),
  ])
    .catch( (err) => logger.error({err}))
    .finally(() => pool.end())
}

function updateNormalText(rowsQuery, updateRowFn, rowDescription) {
  return database.query('updateNormalText', rowsQuery)
    .then( ({rows}) => Promise.all(map(rows, updateRowFn)))
    .then( (updates) => {
      const count = sumBy(updates, update => update.rows.length)
      logger.info(`Updated ${count} ${rowDescription}`)
      return count
    })
}

function updatePropositionRowNormalText (row) {
  return database.query(
    'updatePropositionRowNormalText',
    'update propositions set normal_text = $1 where proposition_id = $2 returning *',
    [normalizeText(row.text), row.proposition_id]
  )
}

function updateWritRowNormalTitle(row) {
  return database.query(
    'updateWritRowNormalTitle',
    'update writs set normal_title = $1 where writ_id = $2 returning *',
    [normalizeText(row.title), row.writ_id]
  )
}

function updateWritQuoteRowNormalQuoteText(row) {
  return database.query(
    'updateWritQuoteRowNormalQuoteText',
    'update writ_quotes set normal_quote_text = $1 where writ_quote_id = $2 returning *',
    [normalizeText(row.quote_text), row.writ_quote_id]
  )
}
