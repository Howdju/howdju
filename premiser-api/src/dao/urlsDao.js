const map = require('lodash/map')
const groupBy = require('lodash/groupBy')
const sortBy = require('lodash/sortBy')

const {
  toUrl,
} = require("../orm")
const {query, queries} = require('./../db')
const {logger} = require('../logger')
const head = require('lodash/head')


const groupUrlsByJustificationId = urls => {
  const urlsByJustificationId = {}
  for (let url of urls) {
    if (!urlsByJustificationId.hasOwnProperty(url.justification_id)) {
      urlsByJustificationId[url.justification_id] = []
    }
    urlsByJustificationId[url.justification_id].push(url)
  }
  return urlsByJustificationId
}

class UrlsDao {

  readUrlEquivalentTo(url) {
    return query('select * from urls where url = $1 and deleted is null', [url.url])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`${rows.length} equivalent URLs`, url)
          }
          return toUrl(head(rows))
        })
  }

  readUrlsForCitationReferenceId(citationReferenceId) {
    return query('select u.* from urls u join citation_reference_urls cru using (url_id) where citation_reference_id = $1', [citationReferenceId])
        .then( ({rows}) => map(rows, toUrl))
  }

  readUrlsByRootStatementId(rootStatementId) {
    const sql = `
      select 
        j.justification_id, 
        u.* 
      from justifications j 
        join citation_references r ON j.basis_type = 'CITATION_REFERENCE' AND j.basis_id = r.citation_reference_id
        join citation_reference_urls USING (citation_reference_id)
        join urls u USING (url_id)
        where
              j.deleted is null
          and j.root_statement_id = $1
        order by j.justification_id
    `
    return query(sql, [rootStatementId]).then( ({rows}) => groupUrlsByJustificationId(rows))
  }

  createUrl(url, userId, now) {
    return query('insert into urls (url, creator_user_id, created) values ($1, $2, $3) returning *',
        [url.url, userId, now])
        .then( ({rows: [row]}) => toUrl(row) )
  }

  update(citationReferenceId, urls) {
    // TODO change to value semantics, where we don't update a URL by ID, but instead just make new ones any time the URL is different
    const {
      'true': extantUrls,
      'false': newUrls
    } = groupBy(urls, u => !!u.id)

    const deleteMissingUrlsQuery = {
      query: `
        with
          citation_reference_urls as (
            select url_id
            from urls join citation_reference_urls using (url_id)
              where citation_reference_id = $1
          )
        delete from urls where 
              url_id in (select * from citation_reference_urls) 
          and url_id != any ($2)
          returning url_id
      `,
      args: [citationReferenceId, map(extantUrls, u => u.id)]
    }

    const updateExtantUrlQuerySql = 'update urls set url = $1 where url_id = $2 returning *'
    const updateExtantUrlQueries = map(extantUrls, u => ({
      query: updateExtantUrlQuerySql,
      args: [u.url, u.id]
    }))
    const createUrlQuerySql = 'insert into urls (url) values ($1) returning *'
    const insertUrlQueries = map(newUrls, u => ({
      query: createUrlQuerySql,
      args: [u.url]
    }))

    const allQueries = [
      deleteMissingUrlsQuery
    ].concat(updateExtantUrlQueries).concat(insertUrlQueries)
    return queries(allQueries).then( ([
                                        {rows: deletedUrlRows},
                                        ...newUrlRows
                                      ]) => {
      logger.debug(`Deleted ${deletedUrlRows.length} URLs from citation_reference_id ${citationReferenceId}`)

      const newUrls = sortBy(map(newUrlRows, ({rows: [url_row]}) => toUrl(url_row) ), u => u.url)

      return newUrls
    })
  }
}

module.exports = new UrlsDao()