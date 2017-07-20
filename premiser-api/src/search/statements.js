const {removeDups} = require("./util")
const {queries} = require('../db')
const {toStatement} = require("../orm")
const map = require('lodash/map')


const searchStatementsFullTextPhraseQuery = `
with
  results as (
    select 
      s.*
      , ts_rank_cd(vector, query) as rank
    from 
      statements s, 
      phraseto_tsquery('english', $1) as query,
      to_tsvector('english', text) as vector
    where 
          query @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const searchStatementsFullTextPlainQuery = `
with
  results as (
    select 
      s.*
      , ts_rank_cd(vector, query) as rank
    from 
      statements s, 
      plainto_tsquery('english', $1) as query,
      to_tsvector('english', text) as vector
    where 
          query @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const searchStatementsFullTextRawQuery = tsquery => `
with
  results as (
    select 
      s.*
      , ts_rank_cd(vector, ${tsquery}) as rank
    from 
      statements s, 
      to_tsvector('english', text) as vector
    where 
          (${tsquery}) @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const searchStatementsContainingTextQuery = `
select * 
from statements 
where 
      text ilike '%' || $1 || '%'
  and deleted is null
`

const searchStatements = (searchText) => {
  searchText = searchText.replace(/[^\w\s]/g, '')
  searchText = searchText.replace(/\s+/g, ' ')
  if (searchText === '') {
    return Promise.resolve([])
  }
  // search statements by phrase (words next to each other) [phraseto_tsquery]
  // then for statements matching all words, [plainto_tsquery]
  // then by any words, [to_tsquery]
  // then by any statements that contain the text [ilike]
  // Combine in order, removing duplicate statements.
  const searchTextWords = searchText.split(/\s+/)
  const tsqueryParts = map(searchTextWords, (w, i) => `to_tsquery('english', $${i+1})`)
  const tsquery = tsqueryParts.join(' || ')
  return queries([
    {
      sql: searchStatementsFullTextPhraseQuery,
      args: [searchText]
    },
    {
      sql: searchStatementsFullTextPlainQuery,
      args: [searchText]
    },
    {
      sql: searchStatementsFullTextRawQuery(tsquery),
      args: searchTextWords
    },
    {
      sql: searchStatementsContainingTextQuery,
      args: [searchText]
    },
  ]).then( ([
      {rows: phraseRows},
      {rows: plainRows},
      {rows: rawRows},
      {rows: containingRows},
    ]) => {
    const statements = removeDups('statement_id', phraseRows, plainRows, rawRows, containingRows)
    return map(statements, toStatement)
  })
}

module.exports = {
  searchStatements
}