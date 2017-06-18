const {removeDups} = require("./util")
const {queries} = require('../db')
const {toCitation} = require("../orm")


const searchCitationsFullTextPhraseQuery = `
with
  results as (
    select 
      c.*
      , ts_rank_cd(vector, query) as rank
    from 
      citations c, 
      phraseto_tsquery('english', $1) as query,
      to_tsvector('english', text) as vector
    where 
          query @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const searchCitationsFullTextPlainQuery = `
with
  results as (
    select 
      c.*
      , ts_rank_cd(vector, query) as rank
    from 
      citations c, 
      plainto_tsquery('english', $1) as query,
      to_tsvector('english', text) as vector
    where 
          query @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const searchCitationsFullTextRawQuery = tsquery => `
with
  results as (
    select 
      c.*
      , ts_rank_cd(vector, ${tsquery}) as rank
    from 
      citations c, 
      to_tsvector('english', text) as vector
    where 
          (${tsquery}) @@ vector
      and deleted is null
  )
select * from results order by rank desc
`

const searchCitationsContainingTextQuery = `
select * 
from citations 
where 
      text ilike '%' || $1 || '%'
  and deleted is null
`

const searchCitations = (searchText) => {
  // remove non-word/non-space characters
  searchText = searchText.replace(/[^\w\s]/g, '')
  // normalize space
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
  const tsqueryParts = searchTextWords.map( (w, i) => `to_tsquery('english', $${i+1})`)
  const tsquery = tsqueryParts.join(' || ')
  return queries([
    {
      sql: searchCitationsFullTextPhraseQuery,
      args: [searchText]
    },
    {
      sql: searchCitationsFullTextPlainQuery,
      args: [searchText]
    },
    {
      sql: searchCitationsFullTextRawQuery(tsquery),
      args: searchTextWords
    },
    {
      sql: searchCitationsContainingTextQuery,
      args: [searchText]
    },
  ]).then( ([
              {rows: phraseRows},
              {rows: plainRows},
              {rows: rawRows},
              {rows: containingRows},
            ]) => {
    const citations = removeDups('citation_id', phraseRows, plainRows, rawRows, containingRows)
    return citations.map(toCitation)
  })
}

module.exports = {
  searchCitations
}