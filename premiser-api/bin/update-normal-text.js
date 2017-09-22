const Promise = require('bluebird')
const map = require('lodash/map')
const sumBy = require('lodash/sumBy')

const {loadEnvironmentEnvVars} = require('howdju-ops')
loadEnvironmentEnvVars()

const {logger} = require('howdju-ops')
const {database} = require('../src/initialization/databaseInitialization')
const {normalizeText} = require("howdju-service-common/lib/daos/util")

const updateStatementRowNormalText = row =>
  database.query('update statements set normal_text = $1 where statement_id = $2 returning *', [normalizeText(row.text), row.statement_id])
const updateWritRowNormalTitle = row =>
  database.query('update writs set normal_title = $1 where writ_id = $2 returning *', [normalizeText(row.title), row.writ_id])
const updateWritQuoteRowNormalQuoteText = row =>
  database.query('update writ_quotes set normal_quote_text = $1 where writ_quote_id = $2 returning *', [normalizeText(row.quote_text), row.writ_quote_id])

database.query('select * from statements')
  .then( ({rows}) => Promise.all(map(rows, updateStatementRowNormalText)))
  .then( (updates) => {
    const count = sumBy(updates, update => update.rows.length)
    logger.info(`Updated ${count} statements`)
    return count
  })
  .catch( (error) => logger.error(error))

database.query('select * from writs')
  .then( ({rows}) => Promise.all(map(rows, updateWritRowNormalTitle)))
  .then( (updates) => {
    const count = sumBy(updates, update => update.rows.length)
    logger.info(`Updated ${count} writs`)
    return count
  })
  .catch( (error) => logger.error(error))

database.query('select * from writ_quotes')
  .then( ({rows}) => Promise.all(map(rows, updateWritQuoteRowNormalQuoteText)))
  .then( (updates) => {
    const count = sumBy(updates, update => update.rows.length)
    logger.info(`Updated ${count} writ quotes`)
    return count
  })
  .catch( (error) => logger.error(error))
