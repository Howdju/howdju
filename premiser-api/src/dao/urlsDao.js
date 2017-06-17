const map = require('lodash/map')
const groupBy = require('lodash/groupBy')

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

  readUrlsByRootStatementId(rootStatementId) {
    const sql = `
      select 
        j.justification_id, 
        u.* 
      from justifications j 
        join citation_references r ON j.basis_type = 'CITATION_REFERENCE' AND j.basis_id = r.citation_reference_id
        join citation_reference_urls cru USING (citation_reference_id)
        join urls u USING (url_id)
        where
              j.deleted is null
          and cru.deleted is null
          and j.root_statement_id = $1
        order by j.justification_id
    `
    return query(sql, [rootStatementId]).then( ({rows}) => groupUrlsByJustificationId(rows))
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