require('./util/env')

const Promise = require('bluebird')
const map = require('lodash/map')

const {query} = require('../src/db')
const {normalizeText} = require('../src/dao/util')

const updateStatementRowNormalText = row =>
    query('update statements set normal_text = $1 where statement_id = $2', [normalizeText(row.text), row.statement_id])
const updateCitationRowNormalText = row =>
    query('update citations set normal_text = $1 where citation_id = $2', [normalizeText(row.text), row.citation_id])

query('select * from statements')
    .then( ({rows}) => {
      // const row = rows[0]
      // console.log(row)
      // console.log(normalizeText(row.text))
      // updateStatementRowNormalText(row)
      return Promise.all(map(rows, updateStatementRowNormalText))
          .then(() => console.log(`Updated ${rows.length} statements`))
    })

query('select * from citations')
    .then( ({rows}) => {
      return Promise.all(map(rows, updateCitationRowNormalText))
          .then(() => console.log(`Updated ${rows.length} citations`))
    })
