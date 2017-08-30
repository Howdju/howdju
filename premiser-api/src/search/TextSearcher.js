const {removeDups} = require("./util")
const {queries} = require('../db')
const map = require('lodash/map')

const emptyResults = Promise.resolve([])

const normalizeSearchText = (searchText) => {
  let normalSearchText = searchText
  // remove non-word/non-space characters
  normalSearchText = normalSearchText.replace(/[^\w\s]/g, '')
  // normalize space
  normalSearchText = normalSearchText.replace(/\s+/g, ' ')
  return normalSearchText
}

const makeSearchFullTextPhraseQuery = (tableName, textColumnName) => `
with
  results as (
    select 
        t.*
      , ts_rank_cd(vector, query) as rank
    from 
      ${tableName} t, 
      phraseto_tsquery('english', $1) as query,
      to_tsvector('english', ${textColumnName}) as vector
    where 
          query @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const makeSearchFullTextPlainQuery = (tableName, textColumnName) => `
with
  results as (
    select 
        t.*
      , ts_rank_cd(vector, query) as rank
    from 
      ${tableName} t, 
      plainto_tsquery('english', $1) as query,
      to_tsvector('english', ${textColumnName}) as vector
    where 
          query @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const makeSearchFullTextRawQuery = (tableName, textColumnName, tsquery) => `
with
  results as (
    select 
        t.*
      , ts_rank_cd(vector, ${tsquery}) as rank
    from 
      ${tableName} t, 
      to_tsvector('english', ${textColumnName}) as vector
    where 
          (${tsquery}) @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const makeSearchContainingTextQuery = (tableName, textColumnName) => `
select * 
from ${tableName} 
where 
      ${textColumnName} ilike '%' || $1 || '%'
  and deleted is null
`

class TextSearcher {
  constructor(tableName, textColumnName, rowMapper, dedupColumnName) {
    this.tableName = tableName
    this.textColumnName = textColumnName
    this.rowMapper = rowMapper
    this.dedupColumnName = dedupColumnName

    this.searchFullTextPhraseQuery = makeSearchFullTextPhraseQuery(tableName, textColumnName)
    this.searchFullTextPlainQuery = makeSearchFullTextPlainQuery(tableName, textColumnName)
    this.searchContainingTextQuery = makeSearchContainingTextQuery(tableName, textColumnName)
  }

  search(searchText) {
    if (!searchText) {
      return emptyResults
    }
    const normalSearchText = normalizeSearchText(searchText)
    if (normalSearchText === '') {
      return emptyResults
    }
    /* Search methodology:
     *   search by phrase (words next to each other) [phraseto_tsquery]
     *   then for rows matching all words, [plainto_tsquery]
     *   then by any words, [to_tsquery]
     *   then by any rows that contain the text [ilike]
     * Combine in order, removing duplicate rows.
     */
    const searchTextWords = normalSearchText.split(/\s+/)
    const tsqueryParts = map(searchTextWords, (w, i) => `to_tsquery('english', $${i+1})`)
    const tsquery = tsqueryParts.join(' || ')
    return queries([
      {
        sql: this.searchFullTextPhraseQuery,
        args: [normalSearchText]
      },
      {
        sql: this.searchFullTextPlainQuery,
        args: [normalSearchText]
      },
      {
        sql: makeSearchFullTextRawQuery(this.tableName, this.textColumnName, tsquery),
        args: searchTextWords
      },
      {
        sql: this.searchContainingTextQuery,
        args: [normalSearchText]
      },
    ]).then( ([
                {rows: phraseRows},
                {rows: plainRows},
                {rows: rawRows},
                {rows: containingRows},
              ]) => {
      const uniqueRows = removeDups(this.dedupColumnName, phraseRows, plainRows, rawRows, containingRows)
      return map(uniqueRows, this.rowMapper)
    })
  }
}

module.exports = TextSearcher