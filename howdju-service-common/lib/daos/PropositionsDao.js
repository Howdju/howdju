const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const head = require('lodash/head')
const isFinite = require('lodash/isFinite')
const map = require('lodash/map')
const snakeCase = require('lodash/snakeCase')
const toNumber = require('lodash/toNumber')

const {
  cleanWhitespace,
  JustificationBasisType,
  JustificationRootTargetType,
  requireArgs,
  SortDirection,
} = require('howdju-common')

const {toProposition} = require("./orm")

const {
  normalizeText,
  mapMany,
} = require('./daosUtil')
const {DatabaseSortDirection} = require('./daoModels')


exports.PropositionsDao = class PropositionsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readPropositionByText(propositionText) {
    return this.database.query(
      'readPropositionByText',
      'select * from propositions where normal_text = $1 and deleted is null',
      [normalizeText(propositionText)]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) propositions have text "${propositionText}"`)
        }
        return toProposition(head(rows))
      })
  }

  readPropositions(sorts, count) {
    requireArgs({sorts, count})

    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = ['deleted is null']
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'proposition_id' : snakeCase(sort.property)
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
      from propositions where ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return this.database.query('readPropositions', sql, args)
      .then(({rows}) => map(rows, toProposition))
  }

  readMorePropositions(sortContinuations, count) {
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
      const columnName = sortContinuation.property === 'id' ? 'proposition_id' : snakeCase(sortContinuation.property)
      let operator = direction === DatabaseSortDirection.ASCENDING ? '>' : '<'
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
      from propositions where 
        ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return this.database.query('readMorePropositions', sql, args)
      .then( ({rows}) => map(rows, toProposition) )
  }

  readPropositionsForIds(propositionIds) {
    return this.database.query(
      'readPropositionsForIds',
      `select * from propositions where proposition_id = any ($1) and deleted is null`,
      [propositionIds]
    )
      .then(mapMany(toProposition))
  }

  readPropositionForId(propositionId) {
    return this.database.query(
      'readPropositionForId',
      `
        with 
          extant_users as (select * from users where deleted is null)
        select 
            s.*
          , u.long_name as creator_user_long_name
        from propositions s left join extant_users u on s.creator_user_id = u.user_id
          where s.proposition_id = $1 and s.deleted is null`,
      [propositionId]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) propositions have ID ${propositionId}`)
        }
        return toProposition(head(rows))
      })
  }

  createProposition(userId, proposition, now) {
    return this.database.query(
      'createProposition',
      'insert into propositions (text, normal_text, creator_user_id, created) values ($1, $2, $3, $4) returning *',
      [cleanWhitespace(proposition.text), normalizeText(proposition.text), userId, now]
    ).then( ({rows: [row]}) => toProposition(row))
  }

  updateProposition(proposition) {
    return this.database.query(
      'updateProposition',
      'update propositions set text = $1, normal_text = $2 where proposition_id = $3 and deleted is null returning *',
      [cleanWhitespace(proposition.text), normalizeText(proposition.text), proposition.id]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`Updated more than one (${rows.length} propositions with ID ${proposition.id}`)
        }
        return toProposition(head(rows))
      })
  }

  deleteProposition(proposition, now) {
    return this.deletePropositionById(proposition.id, now)
  }

  deletePropositionById(propositionId, now) {
    return this.database.query(
      'deletePropositionById',
      'update propositions set deleted = $2 where proposition_id = $1 returning proposition_id',
      [propositionId, now]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) propositions have ID ${propositionId}`)
        }
        return head(map(rows, r => r.proposition_id))
      })
  }

  countEquivalentPropositions(proposition) {
    const sql = `
      select count(*) as count 
      from propositions 
        where 
              normal_text = $1 
          and proposition_id != $2 
          and deleted is null
      `
    return this.database.query(
      'countEquivalentPropositions',
      sql,
      [normalizeText(proposition.text), proposition.id]
    )
      .then (result => {
        return result
      })
      .then( ({rows: [{count}]}) => toNumber(count) )
  }

  hasOtherUsersRootedJustifications(proposition, userId) {
    const sql = `
      select count(*) > 0 as result 
      from justifications 
        where 
              root_target_type = $1
          and root_target_id = $2
          and creator_user_id != $3
          and deleted is null
    `
    return this.database.query('hasOtherUsersRootedJustifications', sql, [JustificationRootTargetType.PROPOSITION,
      proposition.id, userId])
      .then( ({rows: [{result}]}) => result)
  }


  hasOtherUsersRootedJustificationsVotes(proposition, userId) {
    const sql = `
      with
        proposition_justifications as ( 
          select * from justifications where root_target_type = $1 and root_target_id = $2 
        )
      select count(v.*) > 0 as result
      from proposition_justifications sj 
        join justification_votes v on 
              v.justification_id = sj.justification_id
          and v.user_id != $2
          and v.deleted is null
    `
    return this.database.query('hasOtherUsersRootedJustificationsVotes', sql, [JustificationRootTargetType.PROPOSITION,
      proposition.id, userId])
      .then( ({rows: [{result}]}) => result )
  }

  isBasisToOtherUsersJustifications(proposition, userId) {
    const sql = `
      select count(*) > 0 as result
      from justifications j 
        join proposition_compounds sc on 
              j.creator_user_id != $3
          and j.basis_type = $2
          and j.basis_id = sc.proposition_compound_id
        join proposition_compound_atoms sca using (proposition_compound_id)
        join propositions scas on
              sca.proposition_id = scas.proposition_id
          and scas.proposition_id = $1
    `
    return this.database.query('isBasisToOtherUsersJustifications', sql,
      [proposition.id, JustificationBasisType.PROPOSITION_COMPOUND, userId])
      .then( ({rows: [{result}]}) => result)
  }
}
