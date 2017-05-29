const map = require('lodash/map')
const groupBy = require('lodash/groupBy')
const sortBy = require('lodash/sortBy')

const {
  toUrl,
} = require("../orm")
const {query, queries} = require('./../db')
const {logger} = require('../logger')


class UrlsDao {

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