const head = require('lodash/head')
const toNumber = require('lodash/toNumber')

const {query} = require('./../db')
const {
  JustificationBasisType,
  VoteTargetType,
} = require('./../models')
const map = require('lodash/map')
const {toStatement} = require("../orm")
const {logger} = require('../logger')


class StatementsDao {
  readStatementByText(statementText) {
    return query('select * from statements where text = $1 and deleted is null', [statementText])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`More than one (${rows.length}) statements have text "${statementText}"`)
          }
          return toStatement(head(rows))
        })
  }
  readStatements() {
    return query('select * from statements where deleted is null')
        .then(({rows}) => map(rows, toStatement))
  }
  readStatementById(statementId) {
    return query(
        'select * from statements where statement_id = $1 and deleted is null',
        [statementId]
    )
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`More than one (${rows.length}) statements have ID ${statementId}`)
          }
          return toStatement(head(rows))
        })
  }
  createStatement(userId, statement, now) {
    return query(
        'insert into statements (text, creator_user_id, created) values ($1, $2, $3) returning *',
        [statement.text, userId, now]
    ).then( ({rows: [row]}) => toStatement(row))
  }
  updateStatement(statement) {
    return query('update statements set text = $1 where statement_id = $2 and deleted is null returning *',
        [statement.text, statement.id])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`Updated more than one (${rows.length} statements with ID ${statement.id}`)
          }
          return toStatement(head(rows))
        })

  }
  deleteStatement(statement, now) {
    return this.deleteStatementById(statement.id, now)
  }
  deleteStatementById(statementId, now) {
    return query('update statements set deleted = $2 where statement_id = $1 returning statement_id', [statementId, now])
        .then( ({rows}) => map(rows, r => r.statement_id))
  }
  countOtherStatementsHavingSameTextAs(statement) {
    const sql = `
      select count(*) as count 
      from statements 
        where 
              text = $1 
          and statement_id != $2 
          and deleted is null
      `
    return query(sql, [statement.text, statement.id])
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
    return query(sql, [statement.id, userId])
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
    return query(sql, [statement.id, VoteTargetType.JUSTIFICATION, userId])
        .then( ({rows: [{result}]}) => result )
  }

  isBasisToOtherUsersJustifications(statement, userId) {
    const sql = `
      select count(*) > 0 as result
      from justifications
        where 
              basis_type = $2
          and basis_id = $1
          and creator_user_id != $3
    `
    return query(sql, [statement.id, JustificationBasisType.STATEMENT, userId])
        .then( ({rows: [{result}]}) => result)
  }
}

module.exports = new StatementsDao()