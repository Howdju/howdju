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

  readJustificationScoreForJustificationIdAndType(justificationId, justificationScoreType) {
    return this.database.query(
      `select * 
       from justification_scores 
       where 
             justification_id = $1 
         and score_type = $2 
         and deleted is null
       `,
      [justificationId, justificationScoreType])
      .then(mapSingle(this.logger, toJustificationScore, 'justification_scores', {justificationId, justificationScoreType}))
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

  readNewVotesForScoreType(scoreType) {
    return this.database.query(`
      select v.* 
      from votes v
        left join justification_scores js on
              v.target_type = $1
          and v.target_id = js.justification_id
          and js.deleted is null
        where 
              v.deleted is null
          and (
            -- either the vote is newer than its score
            (
                   js.score_type = $2
               and v.created > js.created
            )
            -- or it has no score 
            or js.justification_id is null
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

  deleteScoresHavingNewVotesForScoreType(scoreType, deleted, jobHistoryId) {
    return this.database.query(`
      with 
        scores_having_new_votes as (
          select distinct js.justification_id
          from justification_scores js
            join votes v on 
                  v.target_type = $1
              and v.target_id = js.justification_id
              and v.deleted is null
              and v.created > js.created
            where 
                  js.deleted is null
              and js.score_type = $2
        )
      update justification_scores js set deleted = $3, deletor_job_history_id = $4 
      from scores_having_new_votes new
        where 
              js.justification_id = new.justification_id  
          and js.score_type = $2
      returning *
    `, [VoteTargetType.JUSTIFICATION, scoreType, deleted, jobHistoryId])
      .then(mapMany(toJustificationScore))
  }
}
