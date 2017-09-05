const {
  VoteTargetType,
} = require('howdju-common')

const {
  mapSingle,
  mapMany,
} = require('./util')
const {
  toJustificationScore,
  toVote,
} = require('./orm')

exports.JustificationScoresDao = class JustificationScoresDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createJustificationScore(justificationId, justificationScoreType, score, created, jobHistoryId) {
    return this.database.query(
      `insert into justification_scores (justification_id, score_type, score, created, creator_job_history_id) values
       ($1, $2, $3, $4, $5) 
       returning *`,
      [justificationId, justificationScoreType, score, created, jobHistoryId]
    )
      .then(mapSingle(this.logger, toJustificationScore, 'justification_scores'))
  }

  readUnscoredVotesForScoreType(scoreType) {
    return this.database.query(`
      select v.* 
      from votes v
        left join justification_scores js on
              v.target_type = $1
          and v.target_id = js.justification_id
          and js.deleted is null
        where 
          -- the vote's justification has no score (and isn't already deleted)
          (
                js.justification_id IS NULL
            AND v.deleted IS NULL
          )
          -- or its justification has a score, but the vote was either created or deleted after the score was created
          or (
                js.score_type = $2
            and js.created IS NOT NULL
            and (
                 v.created > js.created
              or v.deleted > js.created
            )
          )
    `, [VoteTargetType.JUSTIFICATION, scoreType])
      .then(mapMany(toVote))
  }

  deleteScoresForType(scoreType, deleted, jobHistoryId) {
    return this.database.query(
      `update justification_scores 
       set deleted = $1, deletor_job_history_id = $2 
       where score_type = $3 and deleted is null`,
      [deleted, jobHistoryId, scoreType]
    )
  }

  deleteJustificationScoreForJustificationIdAndType(
    justificationId,
    justificationScoreType,
    deletedAt,
    deletorJobHistoryId
  ) {
    return this.database.query(
      `update justification_scores 
       set deletor_job_history_id = $1, deleted = $2
       where 
             justification_id = $3
         and score_type = $4
         and deleted is null
       returning *
       `,
      [deletorJobHistoryId, deletedAt, justificationId, justificationScoreType])
      .then(mapSingle(this.logger, toJustificationScore, 'justification_scores', {justificationId, justificationScoreType}))
  }
}