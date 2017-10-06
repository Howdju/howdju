const map = require('lodash/map')
const Promise = require('bluebird')

const emptyResults = Promise.resolve([])

exports.TextSearcher = class TextSearcher {
  constructor(database, tableName, textColumnName, rowMapper, dedupColumnName) {
    this.database = database
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
    return this.database.queries([
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

function removeDups(idName, ...rowsArr) {
  const seenIds = {}
  const deduped = []
  for (const rows of rowsArr) {
    for (const row of rows) {
      if (!seenIds[row[idName]]) {
        deduped.push(row)
        seenIds[row[idName]] = true
      }
    }
  }
  return deduped
}

function normalizeSearchText (searchText) {
  let normalSearchText = searchText
  // remove non-word/non-space characters
  normalSearchText = normalSearchText.replace(/[^\w\s]/g, '')
  // normalize space
  normalSearchText = normalSearchText.replace(/\s+/g, ' ')
  return normalSearchText
}

function makeSearchFullTextPhraseQuery (tableName, textColumnName) {
  return `
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
}


function makeSearchFullTextPlainQuery (tableName, textColumnName) {
  return `
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
}

function makeSearchFullTextRawQuery(tableName, textColumnName, tsquery) {
  return `
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
}

function makeSearchContainingTextQuery(tableName, textColumnName) {
  return `
    select * 
    from ${tableName} 
    where 
          ${textColumnName} ilike '%' || $1 || '%'
      and deleted is null
  `
}