const {
  requireArgs
} = require('howdju-common')

const {
  mapSingle,
  mapMany,
} = require('./util')
const {
  toStatementTagVote,
} = require('./orm')

exports.StatementTagVotesDao = class StatementTagVotesDao {

  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
  }

  createStatementTagVote(userId, statementTagVote, now) {
    return this.database.query(
      `insert into statement_tag_votes (user_id, statement_id, tag_id, polarity, created) 
      values ($1, $2, $3, $4, $5) 
      returning *`,
      [userId, statementTagVote.statement.id, statementTagVote.tag.id, statementTagVote.polarity, now]
    )
      .then(mapSingle(toStatementTagVote))
  }

  readStatementTagVoteForId(statementTagVoteId) {
    return this.database.query(
      `select * from statement_tag_votes where statement_tag_vote_id = $1 and deleted is null`,
      [statementTagVoteId]
    )
      .then(mapSingle(toStatementTagVote))
  }

  readStatementTagVote(userId, statementId, tagId) {
    return this.database.query(
      `select * 
      from statement_tag_votes 
        where 
              user_id = $1 
          and statement_id = $2 
          and tag_id = $3 
          and deleted is null
      `,
      [userId, statementId, tagId]
    )
      .then(mapSingle(this.logger, toStatementTagVote, 'statement_tag_votes', {userId, statementId, tagId}))
  }

  readVotesForStatementIdAsUser(userId, statementId) {
    return this.database.query(
      `select * 
      from statement_tag_votes 
        where 
              user_id = $1 
          and statement_id = $2 
          and deleted is null
      `,
      [userId, statementId]
    )
      .then(mapMany(toStatementTagVote))
  }

  readVotes() {
    return this.database.query(`select * from statement_tag_votes where deleted is null`)
      .then(mapMany(toStatementTagVote))
  }

  deleteStatementTagVote(userId, statementTagVoteId, now) {
    return this.database.query(
      `update statement_tag_votes 
      set deleted = $1 
      where 
            user_id = $2 
        and statement_tag_vote_id = $3 
      returning statement_tag_vote_id
      `,
      [now, userId, statementTagVoteId]
    )
      .then(({rows: [{statement_tag_vote_id}]}) => statement_tag_vote_id)
  }
}
