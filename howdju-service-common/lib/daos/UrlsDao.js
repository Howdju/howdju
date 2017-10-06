const forEach = require('lodash/forEach')
const map = require('lodash/map')

const {
  JustificationBasisType,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
} = require('howdju-common')
const {
  toUrl,
} = require("./orm")

const head = require('lodash/head')


exports.UrlsDao = class UrlsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readUrlForUrl(url) {
    return this.database.query('select * from urls where url = $1 and deleted is null', [url])
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
            wq.writ_quote_id
          , u.url_id
          , u.url
        from justifications j 
            join writ_quotes wq on
                  j.basis_type = $2 
              and j.basis_id = wq.writ_quote_id
            join writ_quote_urls wqu using (writ_quote_id)
            join urls u USING (url_id)
          where
                j.root_statement_id = $1
            and j.deleted is null
            and wq.deleted is null
            and wqu.deleted is null 
            and u.deleted is null
            
      union
        
        select 
            wq.writ_quote_id
          , u.url_id
          , u.url
        from justifications j 
            join justification_basis_compounds jbc on
                  j.basis_type = $3
              and j.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  jbca.entity_type = $4
              and jbca.entity_id = sep.source_excerpt_paraphrase_id
            join writ_quotes wq on
                  sep.source_excerpt_type = $5
              and sep.source_excerpt_id = wq.writ_quote_id
            join writ_quote_urls wqu using (writ_quote_id)
              
            join urls u USING (url_id)
          where 
                j.root_statement_id = $1
            and j.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and wqu.deleted is null
            and u.deleted is null
    `
    return this.database.query(sql, [
      rootStatementId,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptType.WRIT_QUOTE,
    ])
      .then( ({rows}) => groupUrlsByWritQuoteId(rows))
  }

  readDomains() {
    return this.database.query(`select distinct substring( url from '.*://([^/]*)' ) as domain from urls order by domain`)
      .then(({rows}) => map(rows, row => row.domain))
  }

  createUrls(urls, userId, now) {
    return map(urls, url => this.createUrl(url, userId, now))
  }

  createUrl(url, userId, now) {
    return this.database.query('insert into urls (url, creator_user_id, created) values ($1, $2, $3) returning *', [url.url, userId, now])
      .then( ({rows: [row]}) => toUrl(row) )
  }
}

function groupUrlsByWritQuoteId(rows) {
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
