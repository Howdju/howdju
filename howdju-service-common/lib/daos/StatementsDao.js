const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const head = require('lodash/head')
const isFinite = require('lodash/isFinite')
const map = require('lodash/map')
const snakeCase = require('lodash/snakeCase')
const toNumber = require('lodash/toNumber')

const {
  JustificationBasisType,
  VoteTargetType,
  SortDirection,
  requireArgs,
} = require('howdju-common')

const {toStatement} = require("./orm")

const {
  cleanWhitespace,
  normalizeText,
  mapMany,
} = require('./util')
const {DatabaseSortDirection} = require('./daoModels')


exports.StatementsDao = class StatementsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readStatementByText(statementText) {
    return this.database.query('select * from statements where normal_text = $1 and deleted is null', [normalizeText(statementText)])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) statements have text "${statementText}"`)
        }
        return toStatement(head(rows))
      })
  }

  readStatements(sorts, count) {
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
      const columnName = sort.property === 'id' ? 'statement_id' : snakeCase(sort.property)
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
      from statements where ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return this.database.query(sql, args)
      .then(({rows}) => map(rows, toStatement))
  }
  readMoreStatements(sortContinuations, count) {
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
      const columnName = sortContinuation.property === 'id' ? 'statement_id' : snakeCase(sortContinuation.property)
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
      from statements where 
        ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return this.database.query(sql, args)
      .then( ({rows}) => map(rows, toStatement) )
  }

  readStatementsForIds(statementIds) {
    return this.database.query(
      `select * from statements where statement_id = any ($1) and deleted is null`,
      [statementIds]
    )
      .then(mapMany(toStatement))
  }

  readStatementForId(statementId) {
    return this.database.query(
      'select * from statements where statement_id = $1 and deleted is null',
      [statementId]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) statements have ID ${statementId}`)
        }
        return toStatement(head(rows))
      })
  }
  createStatement(userId, statement, now) {
    return this.database.query(
      'insert into statements (text, normal_text, creator_user_id, created) values ($1, $2, $3, $4) returning *',
      [cleanWhitespace(statement.text), normalizeText(statement.text), userId, now]
    ).then( ({rows: [row]}) => toStatement(row))
  }
  updateStatement(statement) {
    return this.database.query('update statements set text = $1, normal_text = $2 where statement_id = $3 and deleted is null returning *',
      [cleanWhitespace(statement.text), normalizeText(statement.text), statement.id])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`Updated more than one (${rows.length} statements with ID ${statement.id}`)
        }
        return toStatement(head(rows))
      })
  }
  deleteStatement(statement, now) {
    return this.deleteStatementById(statement.id, now)
  }
  deleteStatementById(statementId, now) {
    return this.database.query('update statements set deleted = $2 where statement_id = $1 returning statement_id', [statementId, now])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) statements have ID ${statementId}`)
        }
        return head(map(rows, r => r.statement_id))
      })
  }
  countEquivalentStatements(statement) {
    const sql = `
      select count(*) as count 
      from statements 
        where 
              normal_text = $1 
          and statement_id != $2 
          and deleted is null
      `
    return this.database.query(sql, [normalizeText(statement.text), statement.id])
      .then (result => {
        return result
      })
      .then( ({rows: [{count}]}) => toNumber(count) )
  }

  hasOtherUsersRootedJustifications(statement, userId) {
    const sql = `
      select count(*) > 0 as result 
      from justifications 
        where 
              root_statement_id = $1 
          and creator_user_id != $2
          and deleted is null
    `
    return this.database.query(sql, [statement.id, userId])
      .then( ({rows: [{result}]}) => result)
  }


  hasOtherUsersRootedJustificationsVotes(statement, userId) {
    const sql = `
      with
        statement_justifications as ( select * from justifications where root_statement_id = $1 )
      select count(v.*) > 0 as result
      from statement_justifications sj 
        join votes v on 
              v.target_type = $2 
          and v.target_id = sj.justification_id
          and v.user_id != $3
          and v.deleted is null
    `
    return this.database.query(sql, [statement.id, VoteTargetType.JUSTIFICATION, userId])
      .then( ({rows: [{result}]}) => result )
  }

  isBasisToOtherUsersJustifications(statement, userId) {
    const sql = `
      select count(*) > 0 as result
      from justifications j 
        join statement_compounds sc on 
              j.creator_user_id != $3
          and j.basis_type = $2
          and j.basis_id = sc.statement_compound_id
        join statement_compound_atoms sca using (statement_compound_id)
        join statements scas on
              sca.statement_id = scas.statement_id
          and scas.statement_id = $1
    `
    return this.database.query(sql, [statement.id, JustificationBasisType.STATEMENT_COMPOUND, userId])
      .then( ({rows: [{result}]}) => result)
  }
}
