const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const groupBy = require('lodash/groupBy')
const head = require('lodash/head')
const map = require('lodash/map')
const snakeCase = require('lodash/snakeCase')
const sortBy = require('lodash/sortBy')

const urlsDao = require('./urlsDao')
const {
  toCitationReference,
  toCitationReferenceUrl,
  toUrl,
} = require("../orm")
const {query} = require('./../db')
const {
  JustificationBasisType,
  VoteTargetType,
  SortDirection,
  ContinuationSortDirection,
} = require('../models')
const {
  JustificationTargetType,
} = require('howdju-models')
const {logger} = require('../logging')
const {DatabaseSortDirection} = require('./daoModels')


class CitationReferencesDao {

  constructor(urlsDao) {
    this.urlsDao = urlsDao
  }

  read(citationReferenceId) {
    return Promise.all([
      query(`
        select 
            cr.citation_reference_id
          , cr.quote
          , c.citation_id
          , c.text as citation_text
        from citation_references cr join citations c on 
              cr.citation_reference_id = $1
          and cr.citation_id = c.citation_id
          and cr.deleted is null
          and c.deleted is null
          `, [citationReferenceId]),
      this.readUrlsByCitationReferenceId(citationReferenceId)
    ])
        .then( ([
                  {rows: [row]},
                  urls,
                ]) => {
          const citationReference = toCitationReference(row)
          citationReference.urls = urls
          return citationReference
        })
  }

  readCitationReferences(sorts, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = [
        'cr.deleted is null',
        'c.deleted is null',
    ]
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'citation_reference_id' : snakeCase(sort.property)
      const direction = sort.direction === SortDirection.DESCENDING ?
          DatabaseSortDirection.DESCENDING :
          DatabaseSortDirection.ASCENDING
      whereSqls.push(`cr.${columnName} is not null`)
      orderBySqls.push(`cr.${columnName} ${direction}`)
    })
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      select 
          cr.*
        , c.text as citation_text
        , c.created as citation_created
      from citation_references cr
          join citations c USING (citation_id)
        where 
          ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return query(sql, args)
        .then(({rows}) => map(rows, toCitationReference))
  }

  readMoreCitationReferences(sortContinuations, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `\nlimit $${args.length}`
    }

    const whereSqls = [
      'cr.deleted is null',
      'c.deleted is null',
    ]
    const continuationWhereSqls = []
    const prevWhereSqls = []
    const orderBySqls = []
    forEach(sortContinuations, (sortContinuation, index) => {
      const value = sortContinuation.v
      // The default direction is ascending
      const direction = sortContinuation.d === ContinuationSortDirection.DESCENDING ?
          DatabaseSortDirection.DESCENDING :
          DatabaseSortDirection.ASCENDING
      // 'id' is a special property name for entities. The column is prefixed by the entity type
      const columnName = sortContinuation.p === 'id' ? 'citation_reference_id' : snakeCase(sortContinuation.p)
      let operator = direction === 'asc' ? '>' : '<'
      args.push(value)
      const currContinuationWhereSql = concat(prevWhereSqls, [`cr.${columnName} ${operator} $${args.length}`])
      continuationWhereSqls.push(currContinuationWhereSql.join(' and '))
      prevWhereSqls.push(`cr.${columnName} = $${args.length}`)
      whereSqls.push(`cr.${columnName} is not null`)
      orderBySqls.push(`cr.${columnName} ${direction}`)
    })

    const continuationWhereSql = continuationWhereSqls.join('\n or ')
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      select 
          cr.*
        , c.text as citation_text
        , c.created as citation_created
      from citation_references cr
          join citations c using (citation_id)
        where 
          ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return query(sql, args)
        .then( ({rows}) => map(rows, toCitationReference) )
  }

  readCitationReferencesByIdForRootStatementId(rootStatementId) {
    const sql = `
      select 
          cr.citation_reference_id
        , cr.quote
        , c.citation_id
        , c.text as citation_text
      from justifications j 
          join citation_references cr on 
                j.root_statement_id = $1
            and j.basis_type = $2
            and j.deleted is null
            and j.basis_id = cr.citation_reference_id
          join citations c using (citation_id)
      `
    return Promise.all([
        query(sql, [rootStatementId, JustificationBasisType.CITATION_REFERENCE]),
        this.urlsDao.readUrlsByCitationReferenceIdForRootStatementId(rootStatementId)
    ])
        .then( ([
          {rows},
          urlsByCitationReferenceId
        ]) => {
          const citationReferencesById = {}
          forEach(rows, row => {
            const citationReference = toCitationReference(row)
            const citationReferenceId = row.citation_reference_id
            citationReference.urls = urlsByCitationReferenceId[citationReferenceId]
            citationReferencesById[citationReferenceId] = citationReference
          })
          return citationReferencesById
        })
  }

  readCitationReferencesEquivalentTo(citationReference) {
    // Empty strings should be stored as null quotes
    const quote = citationReference.quote || null
    // Could also let the citation.text be missing and just look up by citation ID
    return query(`
      select * 
      from citation_references cr join citations c on 
            cr.citation_id = c.citation_id
        and case when $1::varchar is null then c.citation_id = $2 else c.text = $1 end
        and case when $3::varchar is null then cr.quote is null else cr.quote = $3 end
        and c.deleted is null
        and cr.deleted is null 
      `,
        [citationReference.citation.text, citationReference.citation.id, quote]
    )
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`${rows.length} equivalent citation references`, citationReference)
          }
          return toCitationReference(head(rows))
        })
  }

  readCitationReferenceUrlsForCitationReference(citationReference) {
    return query('select * from citation_reference_urls where citation_reference_id = $1 and deleted is null',
        [citationReference.id])
        .then( ({rows}) => map(rows, toCitationReferenceUrl) )
  }

  readCitationReferenceUrl(citationReference, url) {
    return query('select * from citation_reference_urls where citation_reference_id = $1 and url_id = $2 and deleted is null',
        [citationReference.id, url.id])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`URL ${url.id} is associated with citation reference ${citationReference.id} multiple times`)
          }
          return toCitationReferenceUrl(head(rows))
        })
  }

  createCitationReferenceUrls(citationReference, urls, userId, now) {
    return Promise.all(map(urls, url => this.createCitationReferenceUrl(citationReference, url, userId, now)))
  }

  createCitationReferenceUrl(citationReference, url, userId, now) {
    return query(`
      insert into citation_reference_urls (citation_reference_id, url_id, creator_user_id, created) 
      values ($1, $2, $3, $4)
      returning *
      `,
      [citationReference.id, url.id, userId, now]
    )
        .then( ({rows}) => map(rows, toCitationReferenceUrl))
  }

  createCitationReference(citationReference, userId, now) {
    const sql = `
      insert into citation_references (quote, citation_id, creator_user_id, created) 
      values ($1, $2, $3, $4) 
      returning *
    `
    // Don't insert an empty quote
    const quote = citationReference.quote || null
    return query(sql, [quote, citationReference.citation.id, userId, now])
        .then( ({rows: [row]}) => toCitationReference(row))
  }

  hasEquivalentCitationReferences(citationReference) {
    const sql = `
      select count(*) > 0 has_conflict 
      from citation_references cr join citations c using (citation_id)
        where 
              cr.citation_reference_id != $1 
          and (cr.citation_id = $3 or c.text = $4)
          and cr.quote = $2
          and cr.deleted is null
          and c.deleted is null
      `
    const args = [citationReference.id, citationReference.quote, citationReference.citation.id, citationReference.citation.text]
    return query(sql, args)
        .then( ({rows: [{has_conflict}]}) => has_conflict)
  }

  hasCitationReferenceChanged(citationReference) {
    const sql = `
      select count(*) < 1 as has_changed
      from citation_references 
        where citation_reference_id = $1 and quote = $2
      `
    return query(sql, [citationReference.id, citationReference.quote])
        .then( ({rows: [{has_changed}]}) => has_changed )
  }

  readUrlsByCitationReferenceId(citationReferenceId) {
    return query(`
      select u.* 
      from urls u join citation_reference_urls cru using (url_id) 
        where 
                citation_reference_id = $1
            and u.deleted is null
            and cru.deleted is null
      `, [citationReferenceId])
        .then( ({rows}) => map(rows, toUrl))
  }

  isBasisToJustificationsHavingOtherUsersVotes(userId, citationReference) {
    const sql = `
      with
        basis_justifications as (
          select *
          from justifications
            where basis_type = $1 and basis_id = $2 and deleted is null
        )
        , basis_justification_votes as (
          select * from votes v
            join basis_justifications j on
                  v.user_id != $3
              and v.target_type = $4 
              and v.target_id = j.justification_id
              and v.deleted is null
        )
      select count(*) > 0 as has_votes from basis_justification_votes
    `
    return query(sql, [
      JustificationBasisType.CITATION_REFERENCE,
      citationReference.id,
      userId,
      VoteTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isBasisToOtherUsersJustifications(userId, citationReference) {
    const sql = `
      select count(*) > 0 as has_other_users_justifications 
      from justifications where 
            basis_type = $1 
        and basis_id = $2 
        and creator_user_id != $3
        and deleted is null
        `
    return query(sql, [
      JustificationBasisType.CITATION_REFERENCE,
      citationReference.id,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isBasisToJustificationsHavingOtherUsersCounters(userId, citationReference) {
    const sql = `
      with
        basis_justifications as (
          select *
          from justifications
            where basis_type = $1 and basis_id = $2 and deleted is null
        )
        , counters as (
          select * from justifications cj join basis_justifications j on 
                cj.creator_user_id != $3 
            and cj.target_type = $4 
            and cj.target_id = j.justification_id
            and cj.deleted is null
        )
      select count(*) > 0 as has_other_user_counters from counters
    `
    return query(sql, [
      JustificationBasisType.CITATION_REFERENCE,
      citationReference.id,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  updateCitationReference(citationReference) {
    return query(
        'update citation_references set quote = $1 where citation_reference_id = $2 and deleted is null returning *',
        [citationReference.quote, citationReference.id]
    )
        .then( ({rows: [citationReferenceRow]}) => {
          const updatedCitationReference = toCitationReference(citationReferenceRow)
          updatedCitationReference.citation = citationReference.citation
          updatedCitationReference.urls = citationReferenceRow.urls
          return updatedCitationReference
        })
  }

  deleteCitationReferenceUrls(citationReference, urls, now) {
    const sql = `
      update citation_reference_urls set deleted = $1 
        where citation_reference_id = $2 and url_id = any ($3) 
        returning *
    `
    return query(sql, [now, citationReference.id, map(urls, url => url.id)])
        .then( ({rows}) => map(rows, toCitationReferenceUrl) )
  }
}

module.exports = new CitationReferencesDao(urlsDao)