const {query, queries} = require('./../db')
const {
  JustificationBasisType,
  VoteTargetType,
} = require('./../models')

class StatementsDao {
  countOtherStatementsHavingSameTextAs(statement) {
    const sql = 'select count(*) as count from statements where text = $1 and statement_id != $2 and deleted is null'
    return query(sql, [statement.text, statement.id])
        .then( ({rows: [{count}]}) => count )
  }
  hasOtherUserInteractions(userId, statement) {
    const otherUserJustificationsCountSql = `
      select count(*) as count 
      from justifications 
        where 
              root_statement_id = $1 
          and creator_user_id != $2
          and deleted is null
    `
    const otherUsersVotesCountSql = `
      with
        statement_justifications as ( select * from justifications where root_statement_id = $1 )
      select count(v.*) as count
      from statement_justifications sj 
        join votes v on 
              v.target_type = $2 
          and v.target_id = sj.justification_id
          and v.user_id != $3
          and v.deleted is null
    `
    const justificationsForWhichIsBasisCountSql = `
      select count(*) as count
      from justifications
        where 
              basis_type = $2
          and basis_id = $1
    `
    return queries([
      {query: otherUserJustificationsCountSql, args: [statement.id, userId]},
      {query: otherUsersVotesCountSql, args: [statement.id, VoteTargetType.JUSTIFICATION, userId]},
      {query: justificationsForWhichIsBasisCountSql, args: [statement.id, JustificationBasisType.STATEMENT]},
    ])
        .then( ([
            {rows: [{count: otherUserJustificationsCount}]},
            {rows: [{count: otherUsersVotesCounts}]},
                  {rows: [{count: justificationsForWhichIsBasisCount}]},
            ]) => {
          return (
                 otherUserJustificationsCount > 0
              || otherUsersVotesCounts > 0
              || justificationsForWhichIsBasisCount > 0
          )
        })
  }
}

module.exports = {
  statementsDao: new StatementsDao()
}