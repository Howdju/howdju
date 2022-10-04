const map = require('lodash/map')
const head = require('lodash/head')
const snakeCase = require('lodash/snakeCase')
const forEach = require('lodash/forEach')
const concat = require('lodash/concat')

const {
  JustificationBasisType,
  SortDirection,
  JustificationTargetType,
  cleanWhitespace,
} = require('howdju-common')

const {
  normalizeText,
  mapSingle,
} = require('./daosUtil')
const {DatabaseSortDirection} = require('./daoModels')
const {
  toWrit,
} = require('./orm')


exports.WritsDao = class WritsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createWrit(writ, userId, now) {
    const sql = 'insert into writs (title, normal_title, creator_user_id, created) values ($1, $2, $3, $4) returning *'
    return this.database.query('createWrit', sql, [cleanWhitespace(writ.title), normalizeText(writ.title), userId, now])
      .then( ({rows: [row]}) => toWrit(row) )
  }

  readWritForId(writId) {
    return this.database.query('readWritForId', `select * from writs where writ_id = $1 and deleted is null`, [writId])
      .then(mapSingle(this.logger, toWrit, 'writs', {writId}))
  }

  readWritEquivalentTo(writ) {
    return this.database.query('readWritEquivalentTo',
      'select * from writs where normal_title = $1 and deleted is null', [normalizeText(writ.title)])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`Multiple (${rows.length}) equivalent writs found`, {writ})
        }
        return toWrit(head(rows))
      })
  }

  readWrits(sorts, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = ['deleted is null']
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'writ_id' : snakeCase(sort.property)
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
      from writs where ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return this.database.query('readWrits', sql, args)
      .then(({rows}) => map(rows, toWrit))
  }

  readMoreWrits(sortContinuations, count) {
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
      const value = sortContinuation.value
      // The default direction is ascending
      const direction = sortContinuation.direction === SortDirection.DESCENDING ?
        DatabaseSortDirection.DESCENDING :
        DatabaseSortDirection.ASCENDING
      // 'id' is a special property name for entities. The column is prefixed by the entity type
      const columnName = sortContinuation.property === 'id' ? 'writ_id' : snakeCase(sortContinuation.property)
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
      from writs where
        ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return this.database.query('readMoreWrits', sql, args)
      .then( ({rows}) => map(rows, toWrit) )
  }

  update(writ) {
    return this.database.query(
      'updateWrit',
      'update writs set title = $1, normal_title = $2 where writ_id = $3 returning *',
      [cleanWhitespace(writ.title), normalizeText(writ.title), writ.id]
    )
      .then( ({rows: [writRow]}) => toWrit(writRow) )
  }

  hasEquivalentWrits(writ) {
    const sql = `
      select count(*) > 0 as has_conflict
      from writs where writ_id != $1 and normal_title = $2 and deleted is null
      `
    return this.database.query('hasEquivalentWrits', sql, [writ.id, normalizeText(writ.title)])
      .then( ({rows: [{has_conflict}]}) => has_conflict )
  }

  hasWritChanged(writ) {
    const sql = `
      select count(*) < 1 as has_changed
      from writs where writ_id = $1 and title = $2
      `
    return this.database.query('hasWritChanged', sql, [writ.id, cleanWhitespace(writ.title)])
      .then( ({rows: [{has_changed}]}) => has_changed )
  }

  isWritOfBasisToJustificationsHavingOtherUsersVotes(userId, writ) {
    const sql = `
      with
        writ_writ_quotes as (
          select *
          from writ_quotes where writ_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join writ_writ_quotes wq on
                j.basis_type = $2
            and j.basis_id = wq.writ_quote_id
            and j.deleted is null
        )
        , basis_justification_votes as (
          select * from justification_votes v
            join basis_justifications j on
                  v.user_id != $3
              and v.justification_id = j.justification_id
              and v.deleted is null
        )
      select count(*) > 0 as has_votes from basis_justification_votes
    `
    return this.database.query('isWritOfBasisToJustificationsHavingOtherUsersVotes', sql, [
      writ.id,
      JustificationBasisType.WRIT_QUOTE,
      userId,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isWritOfBasisToOtherUsersJustifications(userId, writ) {
    const sql = `
      with
        writ_writ_quotes as (
          select *
          from writ_quotes where writ_id = $1 and deleted is null
        )
      select count(*) > 0 as has_other_users_justifications
      from justifications j join writ_writ_quotes wq on
            j.basis_id = wq.writ_quote_id
        and j.basis_type = $2
        and j.creator_user_id != $3
        and j.deleted is null
    `
    return this.database.query('isWritOfBasisToOtherUsersJustifications', sql, [
      writ.id,
      JustificationBasisType.WRIT_QUOTE,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isWritOfBasisToJustificationsHavingOtherUsersCounters(userId, writ) {
    const sql = `
      with
        writ_writ_quotes as (
          select *
          from writ_quotes where writ_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join writ_writ_quotes wq on
                basis_type = $2
            and j.basis_id = wq.writ_quote_id and j.deleted is null
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
    return this.database.query('isWritOfBasisToJustificationsHavingOtherUsersCounters', sql, [
      writ.id,
      JustificationBasisType.WRIT_QUOTE,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }
}
