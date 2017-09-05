const Promise = require('bluebird')
const map = require('lodash/map')

const {loadEnvironmentEnvVars} = require('howdju-ops')
loadEnvironmentEnvVars()

const {logger} = require('howdju-ops')
const {database} = require('../src/initialization/databaseInitialization')
const {normalizeText} = require("howdju-service-common/lib/daos/util")

const updateStatementRowNormalText = row =>
  database.query('update statements set normal_text = $1 where statement_id = $2 returning *', [normalizeText(row.text), row.statement_id])
const updateCitationRowNormalText = row =>
  database.query('update citations set normal_text = $1 where citation_id = $2 returning *', [normalizeText(row.text), row.citation_id])

database.query('select * from statements')
  .then( ({rows}) => Promise.all(map(rows, updateStatementRowNormalText)))
  .then( ({rows}) => logger.info(`Updated ${rows.length} statements`))
  .catch( (error) => logger.error(error))

database.query('select * from citations')
  .then( ({rows}) => Promise.all(map(rows, updateCitationRowNormalText)))
  .then( ({rows}) => logger.info(`Updated ${rows.length} citations`))
  .catch( (error) => logger.error(error))