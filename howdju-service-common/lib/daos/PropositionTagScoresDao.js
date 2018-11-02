const {
  mapSingle,
  mapMany,
} = require('./daosUtil')
const {
  toPropositionTagScore,
  toPropositionTagVote,
} = require('./orm')

exports.PropositionTagScoresDao = class PropositionTagScoresDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createPropositionTagScore(propositionId, tagId, PropositionTagScoreType, score, created, jobHistoryId) {
    return this.database.query(
      'createPropositionTagScore',
      `insert into proposition_tag_scores (proposition_id, tag_id, score_type, score, created, creator_job_history_id) values
       ($1, $2, $3, $4, $5, $6) 
       returning *`,
      [propositionId, tagId, PropositionTagScoreType, score, created, jobHistoryId]
    )
      .then(mapSingle(this.logger, toPropositionTagScore, 'proposition_tag_scores'))
  }

  readUnscoredVotesForScoreType(scoreType) {
    return this.database.query(
      'readUnscoredVotesForScoreType',
      `
        select v.* 
        from proposition_tag_votes v
          left join proposition_tag_scores s using (proposition_id, tag_id)
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
      `,
      [scoreType]
    )
      .then(mapMany(toPropositionTagVote))
  }

  deleteScoresForType(scoreType, now, jobHistoryId) {
    return this.database.query(
      'deleteScoresForType',
      `update proposition_tag_scores 
       set deleted = $1, deletor_job_history_id = $2 
       where score_type = $3 and deleted is null`,
      [now, jobHistoryId, scoreType]
    )
  }

  deletePropositionTagScoreFor(
    propositionId,
    tagId,
    PropositionTagScoreType,
    deletedAt,
    deletorJobHistoryId
  ) {
    return this.database.query(
      'deletePropositionTagScoreFor',
      `update proposition_tag_scores 
       set deletor_job_history_id = $1, deleted = $2
       where 
             proposition_id = $3
         and tag_id = $4
         and score_type = $5
         and deleted is null
       returning *
       `,
      [deletorJobHistoryId, deletedAt, propositionId, tagId, PropositionTagScoreType])
      .then(mapSingle(this.logger, toPropositionTagScore, 'proposition_tag_scores', {propositionId, tagId, PropositionTagScoreType}))
  }
}
