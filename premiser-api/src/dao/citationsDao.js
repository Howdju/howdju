const map = require('lodash/map')
const groupBy = require('lodash/groupBy')
const sortBy = require('lodash/sortBy')
const head = require('lodash/head')
const snakeCase = require('lodash/snakeCase')
const forEach = require('lodash/forEach')
const concat = require('lodash/concat')

const {
  toCitation,
} = require("../orm")
const {query} = require('./../db')
const {
  JustificationBasisType,
  JustificationTargetType,
  VoteTargetType,
  SortDirection,
  ContinuationSortDirection,
} = require('../models')
const {logger} = require('../logger')
const {cleanWhitespace, normalizeText} = require('./util')
const {DatabaseSortDirection} = require('./daoModels')


class CitationsDao {
  readCitations(sorts, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = ['deleted is null']
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'citation_id' : snakeCase(sort.property)
      const direction = sort.direction === SortDirection.DESCENDING ?
          DatabaseSortDirection.DESCENDING :
          DatabaseSortDirection.ASCENDING
      whereSqls.push(`${columnName} is not null`)
      orderBySqls.push(columnName + ' ' + direction)
    })
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      select * 
      from citations where ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return query(sql, args)
        .then(({rows}) => map(rows, toCitation))
  }

  readMoreCitations(sortContinuations, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `\nlimit $${args.length}`
    }

    const whereSqls = ['deleted is null']
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
      const columnName = sortContinuation.p === 'id' ? 'citation_id' : snakeCase(sortContinuation.p)
      let operator = direction === 'asc' ? '>' : '<'
      args.push(value)
      const currContinuationWhereSql = concat(prevWhereSqls, [`${columnName} ${operator} $${args.length}`])
      continuationWhereSqls.push(currContinuationWhereSql.join(' and '))
      prevWhereSqls.push(`${columnName} = $${args.length}`)
      whereSqls.push(`${columnName} is not null`)
      orderBySqls.push(`${columnName} ${direction}`)
    })

    const continuationWhereSql = continuationWhereSqls.join('\n or ')
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      select * 
      from citations where 
        ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return query(sql, args)
        .then( ({rows}) => map(rows, toCitation) )
  }

  readCitationEquivalentTo(citation) {
    return query('select * from citations where normal_text = $1 and deleted is null', [normalizeText(citation.text)])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`${rows.length} equivalent citations found`, citation)
          }
          return toCitation(head(rows))
        })
  }
  createCitation(citation, userId, now) {
    const sql = 'insert into citations (text, normal_text, creator_user_id, created) values ($1, $2, $3, $4) returning *'
    return query(sql, [cleanWhitespace(citation.text), normalizeText(citation.text), userId, now])
        .then( ({rows: [row]}) => toCitation(row) )
  }
  hasEquivalentCitations(citation) {
    const sql = `
      select count(*) > 0 as has_conflict
      from citations where citation_id != $1 and normal_text = $2 and deleted is null
      `
    return query(sql, [citation.id, normalizeText(citation.text)])
        .then( ({rows: [{has_conflict}]}) => has_conflict )
  }

  hasCitationChanged(citation) {
    const sql = `
      select count(*) < 1 as has_changed
      from citations where citation_id = $1 and text = $2
      `
    return query(sql, [citation.id, cleanWhitespace(citation.text)])
        .then( ({rows: [{has_changed}]}) => has_changed )
  }

  isCitationOfBasisToJustificationsHavingOtherUsersVotes(userId, citation) {
    const sql = `
      with
        citation_citation_references as (
          select *
          from citation_references where citation_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join citation_citation_references cr on 
                j.basis_type = $2
            and j.basis_id = cr.citation_reference_id
            and j.deleted is null
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
      citation.id,
      JustificationBasisType.CITATION_REFERENCE,
      userId,
      VoteTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isCitationOfBasisToOtherUsersJustifications(userId, citation) {
    const sql = `
      with 
        citation_citation_references as (
          select *
          from citation_references where citation_id = $1 and deleted is null
        )
      select count(*) > 0 as has_other_users_justifications 
      from justifications j join citation_citation_references cr on
            j.basis_id = cr.citation_reference_id
        and j.basis_type = $2 
        and j.creator_user_id != $3
        and j.deleted is null
    `
    return query(sql, [
      citation.id,
      JustificationBasisType.CITATION_REFERENCE,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isCitationOfBasisToJustificationsHavingOtherUsersCounters(userId, citation) {
    const sql = `
      with
        citation_citation_references as (
          select *
          from citation_references where citation_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join citation_citation_references cr on
                basis_type = $2 
            and j.basis_id = cr.citation_reference_id and j.deleted is null
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
      citation.id,
      JustificationBasisType.CITATION_REFERENCE,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  update(citation) {
    return query(
        'update citations set text = $1, normal_text = $2 where citation_id = $3 returning *',
        [cleanWhitespace(citation.text), normalizeText(citation.text), citation.id]
    )
        .then( ({rows: [citationRow]}) => toCitation(citationRow) )
  }
}

module.exports = new CitationsDao()