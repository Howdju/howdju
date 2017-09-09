const Promise = require('bluebird')
const map = require('lodash/map')

const {loadEnvironmentEnvVars} = require('howdju-ops')
loadEnvironmentEnvVars()

const {logger} = require('howdju-ops')
const {database} = require('../src/initialization/databaseInitialization')
const {normalizeText} = require("howdju-service-common/lib/daos/util")

const updateStatementRowNormalText = row =>
  database.query('update statements set normal_text = $1 where statement_id = $2 returning *', [normalizeText(row.text), row.statement_id])
const updateWritingRowNormalTitle = row =>
  database.query('update writings set normal_title = $1 where writing_id = $2 returning *', [normalizeText(row.title), row.writing_id])

database.query('select * from statements')
  .then( ({rows}) => Promise.all(map(rows, updateStatementRowNormalText)))
  .then( ({rows}) => logger.info(`Updated ${rows.length} statements`))
  .catch( (error) => logger.error(error))

database.query('select * from writings')
  .then( ({rows}) => Promise.all(map(rows, updateWritingRowNormalTitle)))
  .then( ({rows}) => logger.info(`Updated ${rows.length} writings`))
  .catch( (error) => logger.error(error))
