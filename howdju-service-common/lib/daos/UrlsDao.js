const forEach = require('lodash/forEach')
const map = require('lodash/map')

const {
  JustificationBasisType
} = require('howdju-common')
const {
  toUrl,
} = require("./orm")

const head = require('lodash/head')


const groupUrlsByWritQuoteId = rows => {
  const urlsByWritQuoteId = {}
  forEach(rows, row => {
    let urls = urlsByWritQuoteId[row.writ_quote_id]
    if (!urls) {
      urlsByWritQuoteId[row.writ_quote_id] = urls = []
    }
    urls.push(toUrl(row))
  })
  return urlsByWritQuoteId
}

exports.UrlsDao = class UrlsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readUrlEquivalentTo(url) {
    return this.database.query('select * from urls where url = $1 and deleted is null', [url.url])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`${rows.length} equivalent URLs`, url)
        }
        return toUrl(head(rows))
      })
  }

  readUrlsByWritQuoteIdForRootStatementId(rootStatementId) {
    const sql = `
      select 
          cr.writ_quote_id
        , u.url_id
        , u.url
      from justifications j 
        join writ_quotes cr on
              j.root_statement_id = $1
          and j.deleted is null 
          and j.basis_type = $2 
          and j.basis_id = cr.writ_quote_id
        join writ_quote_urls cru on
              cr.writ_quote_id = cru.writ_quote_id
          and cru.deleted is null
        join urls u USING (url_id)
        order by j.justification_id
    `
    return this.database.query(sql, [rootStatementId, JustificationBasisType.WRIT_QUOTE])
      .then( ({rows}) => groupUrlsByWritQuoteId(rows))
  }

  createUrls(urls, userId, now) {
    return map(urls, url => this.createUrl(url, userId, now))
  }

  createUrl(url, userId, now) {
    return this.database.query('insert into urls (url, creator_user_id, created) values ($1, $2, $3) returning *', [url.url, userId, now])
      .then( ({rows: [row]}) => toUrl(row) )
  }
}
