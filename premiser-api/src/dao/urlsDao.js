const forEach = require('lodash/forEach')
const groupBy = require('lodash/groupBy')
const map = require('lodash/map')

const {
  toUrl,
} = require("../orm")
const {query} = require('./../db')
const {logger} = require('../logger')
const head = require('lodash/head')
const {
  JustificationBasisType
} = require('../models')


const groupUrlsByCitationReferenceId = rows => {
  const urlsByCitationReferenceId = {}
  forEach(rows, row => {
    let urls = urlsByCitationReferenceId[row.citation_reference_id]
    if (!urls) {
      urlsByCitationReferenceId[row.citation_reference_id] = urls = []
    }
    urls.push(toUrl(row))
  })
  return urlsByCitationReferenceId
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

  readUrlsByCitationReferenceIdForRootStatementId(rootStatementId) {
    const sql = `
      select 
          cr.citation_reference_id
        , u.url_id
        , u.url
      from justifications j 
        join citation_references cr on
              j.root_statement_id = $1
          and j.deleted is null 
          and j.basis_type = $2 
          and j.basis_id = cr.citation_reference_id
        join citation_reference_urls cru on
              cr.citation_reference_id = cru.citation_reference_id
          and cru.deleted is null
        join urls u USING (url_id)
        order by j.justification_id
    `
    return query(sql, [rootStatementId, JustificationBasisType.CITATION_REFERENCE])
        .then( ({rows}) => groupUrlsByCitationReferenceId(rows))
  }

  createUrls(urls, userId, now) {
    return map(urls, url => this.createUrl(url, userId, now))
  }

  createUrl(url, userId, now) {
    return query('insert into urls (url, creator_user_id, created) values ($1, $2, $3) returning *', [url.url, userId, now])
        .then( ({rows: [row]}) => toUrl(row) )
  }
}

module.exports = new UrlsDao()