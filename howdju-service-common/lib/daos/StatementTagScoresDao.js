const {
  mapSingle,
  mapMany,
} = require('./util')
const {
  toStatementTagScore,
  toStatementTagVote,
} = require('./orm')

exports.StatementTagScoresDao = class StatementTagScoresDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createStatementTagScore(statementId, tagId, statementTagScoreType, score, created, jobHistoryId) {
    return this.database.query(
      `insert into statement_tag_scores (statement_id, tag_id, score_type, score, created, creator_job_history_id) values
       ($1, $2, $3, $4, $5, $6) 
       returning *`,
      [statementId, tagId, statementTagScoreType, score, created, jobHistoryId]
    )
      .then(mapSingle(this.logger, toStatementTagScore, 'statement_tag_scores'))
  }

  readUnscoredVotesForScoreType(scoreType) {
    return this.database.query(`
      select v.* 
      from statement_tag_votes v
        left join statement_tag_scores s using (statement_id, tag_id)
        where 
          s.deleted is null 
          and (
            -- the vote's target has no score (and the vote isn't already deleted)
            (
                  s.score_type IS NULL
              AND v.deleted IS NULL
            )
            -- or there is a score, but the vote was either created or deleted after the score was created
            or (
                  s.score_type = $1
              and s.created IS NOT NULL
              and (
                   v.created > s.created
                or (
                      v.deleted > s.created
                      -- (ensure the vote wasn't both created and deleted after the score)
                  and v.created < s.created
                )
              )
            )
          )
    `, [scoreType])
      .then(mapMany(toStatementTagVote))
  }

  deleteScoresForType(scoreType, now, jobHistoryId) {
    return this.database.query(
      `update statement_tag_scores 
       set deleted = $1, deletor_job_history_id = $2 
       where score_type = $3 and deleted is null`,
      [now, jobHistoryId, scoreType]
    )
  }

  deleteStatementTagScoreFor(
    statementId,
    tagId,
    statementTagScoreType,
    deletedAt,
    deletorJobHistoryId
  ) {
    return this.database.query(
      `update statement_tag_scores 
       set deletor_job_history_id = $1, deleted = $2
       where 
             statement_id = $3
         and tag_id = $4
         and score_type = $5
         and deleted is null
       returning *
       `,
      [deletorJobHistoryId, deletedAt, statementId, tagId, statementTagScoreType])
      .then(mapSingle(this.logger, toStatementTagScore, 'statement_tag_scores', {statementId, tagId, statementTagScoreType}))
  }
}
