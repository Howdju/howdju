const map = require('lodash/map')
const head = require('lodash/head')
const snakeCase = require('lodash/snakeCase')
const forEach = require('lodash/forEach')
const concat = require('lodash/concat')

const {
  toCitation,
} = require('./orm')

const {
  JustificationBasisType,
  VoteTargetType,
  SortDirection,
  ContinuationSortDirection,
  JustificationTargetType,
} = require('howdju-common')
const {cleanWhitespace, normalizeText} = require('./util')
const {DatabaseSortDirection} = require('./daoModels')


exports.CitationsDao = class CitationsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

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
    return this.database.query(sql, args)
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
    forEach(sortContinuations, (sortContinuation) => {
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
    return this.database.query(sql, args)
      .then( ({rows}) => map(rows, toCitation) )
  }

  readCitationEquivalentTo(citation) {
    return this.database.query('select * from citations where normal_text = $1 and deleted is null', [normalizeText(citation.text)])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`${rows.length} equivalent citations found`, citation)
        }
        return toCitation(head(rows))
      })
  }
  createCitation(citation, userId, now) {
    const sql = 'insert into citations (text, normal_text, creator_user_id, created) values ($1, $2, $3, $4) returning *'
    return this.database.query(sql, [cleanWhitespace(citation.text), normalizeText(citation.text), userId, now])
      .then( ({rows: [row]}) => toCitation(row) )
  }
  hasEquivalentCitations(citation) {
    const sql = `
      select count(*) > 0 as has_conflict
      from citations where citation_id != $1 and normal_text = $2 and deleted is null
      `
    return this.database.query(sql, [citation.id, normalizeText(citation.text)])
      .then( ({rows: [{has_conflict}]}) => has_conflict )
  }

  hasCitationChanged(citation) {
    const sql = `
      select count(*) < 1 as has_changed
      from citations where citation_id = $1 and text = $2
      `
    return this.database.query(sql, [citation.id, cleanWhitespace(citation.text)])
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
    return this.database.query(sql, [
      citation.id,
      JustificationBasisType.TEXTUAL_SOURCE_QUOTE,
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
    return this.database.query(sql, [
      citation.id,
      JustificationBasisType.TEXTUAL_SOURCE_QUOTE,
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
    return this.database.query(sql, [
      citation.id,
      JustificationBasisType.TEXTUAL_SOURCE_QUOTE,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  update(citation) {
    return this.database.query(
      'update citations set text = $1, normal_text = $2 where citation_id = $3 returning *',
      [cleanWhitespace(citation.text), normalizeText(citation.text), citation.id]
    )
      .then( ({rows: [citationRow]}) => toCitation(citationRow) )
  }
}
