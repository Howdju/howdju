require('../lib/env')

const Promise = require('bluebird')
const map = require('lodash/map')

const logger = require('../lib/logger')
const {database} = require('../src/initialization/databaseInitialization')
const {normalizeText} = require("howdju-service-common/lib/daos/util")

const updateStatementRowNormalText = row =>
  database.query('update statements set normal_text = $1 where statement_id = $2', [normalizeText(row.text), row.statement_id])
const updateCitationRowNormalText = row =>
  database.query('update citations set normal_text = $1 where citation_id = $2', [normalizeText(row.text), row.citation_id])

database.query('select * from statements')
  .then( ({rows}) => {
    return Promise.all(map(rows, updateStatementRowNormalText))
      .then(() => logger.info(`Updated ${rows.length} statements`))
  })

database.query('select * from citations')
  .then( ({rows}) => {
    return Promise.all(map(rows, updateCitationRowNormalText))
      .then(() => logger.info(`Updated ${rows.length} citations`))
  })
