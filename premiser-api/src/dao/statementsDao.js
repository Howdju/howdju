const {query, queries} = require('./../db')
const {
  VoteTargetType
} = require('./../models')

class StatementsDao {
  countOtherStatementsHavingSameTextAs(statement) {
    const sql = 'select count(*) as count from statements where text = $1 and statement_id != $2 and deleted is null'
    return query(sql, [statement.text, statement.id])
        .then( ({rows: [{count}]}) => count )
  }
  hasOtherUserInteractions(userId, statement) {
    const otherUserJustificationsSql = `
      select count(*) as count 
      from justifications 
        where 
              root_statement_id = $1 
          and creator_user_id != $2
          and deleted is null
    `
    const otherUsersVotesSql = `
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
    return queries([
      {query: otherUserJustificationsSql, args: [statement.id, userId]},
      {query: otherUsersVotesSql, args: [statement.id, VoteTargetType.JUSTIFICATION, userId]},
    ])
        .then( ([
            {rows: [{count: otherUserJustificationsCount}]},
            {rows: [{count: otherUsersVotes}]}
            ]) => {
          return otherUserJustificationsCount > 0 || otherUsersVotes > 0
        })
  }
}

module.exports = {
  statementsDao: new StatementsDao()
}