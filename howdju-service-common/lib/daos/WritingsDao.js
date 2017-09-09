const map = require('lodash/map')
const head = require('lodash/head')
const snakeCase = require('lodash/snakeCase')
const forEach = require('lodash/forEach')
const concat = require('lodash/concat')

const {
  toWriting,
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


exports.WritingsDao = class WritingsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readWritings(sorts, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = ['deleted is null']
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'writing_id' : snakeCase(sort.property)
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
      from writings where ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return this.database.query(sql, args)
      .then(({rows}) => map(rows, toWriting))
  }

  readMoreWritings(sortContinuations, count) {
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
      const columnName = sortContinuation.p === 'id' ? 'writing_id' : snakeCase(sortContinuation.p)
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
      from writings where 
        ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return this.database.query(sql, args)
      .then( ({rows}) => map(rows, toWriting) )
  }

  readWritingEquivalentTo(writing) {
    return this.database.query('select * from writings where normal_title = $1 and deleted is null', [normalizeText(writing.title)])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`${rows.length} equivalent writings found`, writing)
        }
        return toWriting(head(rows))
      })
  }
  createWriting(writing, userId, now) {
    const sql = 'insert into writings (title, normal_text, creator_user_id, created) values ($1, $2, $3, $4) returning *'
    return this.database.query(sql, [cleanWhitespace(writing.title), normalizeText(writing.title), userId, now])
      .then( ({rows: [row]}) => toWriting(row) )
  }
  hasEquivalentWritings(writing) {
    const sql = `
      select count(*) > 0 as has_conflict
      from writings where writing_id != $1 and normal_text = $2 and deleted is null
      `
    return this.database.query(sql, [writing.id, normalizeText(writing.title)])
      .then( ({rows: [{has_conflict}]}) => has_conflict )
  }

  hasWritingChanged(writing) {
    const sql = `
      select count(*) < 1 as has_changed
      from writings where writing_id = $1 and title = $2
      `
    return this.database.query(sql, [writing.id, cleanWhitespace(writing.title)])
      .then( ({rows: [{has_changed}]}) => has_changed )
  }

  isWritingOfBasisToJustificationsHavingOtherUsersVotes(userId, writing) {
    const sql = `
      with
        writing_writing_quotes as (
          select *
          from writing_quotes where writing_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join writing_writing_quotes wq on 
                j.basis_type = $2
            and j.basis_id = wq.writing_quote_id
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
      writing.id,
      JustificationBasisType.WRITING_QUOTE,
      userId,
      VoteTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isWritingOfBasisToOtherUsersJustifications(userId, writing) {
    const sql = `
      with 
        writing_writing_quotes as (
          select *
          from writing_quotes where writing_id = $1 and deleted is null
        )
      select count(*) > 0 as has_other_users_justifications 
      from justifications j join writing_writing_quotes wq on
            j.basis_id = wq.writing_quote_id
        and j.basis_type = $2 
        and j.creator_user_id != $3
        and j.deleted is null
    `
    return this.database.query(sql, [
      writing.id,
      JustificationBasisType.WRITING_QUOTE,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isWritingOfBasisToJustificationsHavingOtherUsersCounters(userId, writing) {
    const sql = `
      with
        writing_writing_quotes as (
          select *
          from writing_quotes where writing_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join writing_writing_quotes wq on
                basis_type = $2 
            and j.basis_id = wq.writing_quote_id and j.deleted is null
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
      writing.id,
      JustificationBasisType.WRITING_QUOTE,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  update(writing) {
    return this.database.query(
      'update writings set text = $1, normal_title = $2 where writing_id = $3 returning *',
      [cleanWhitespace(writing.title), normalizeText(writing.title), writing.id]
    )
      .then( ({rows: [writingRow]}) => toWriting(writingRow) )
  }
}
