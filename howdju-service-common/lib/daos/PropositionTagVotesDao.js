const {
  requireArgs
} = require('howdju-common')

const {
  mapSingle,
  mapMany,
} = require('./util')
const {
  toPropositionTagVote,
} = require('./orm')

exports.PropositionTagVotesDao = class PropositionTagVotesDao {

  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
  }

  createPropositionTagVote(userId, propositionTagVote, now) {
    return this.database.query(
      `insert into proposition_tag_votes (user_id, proposition_id, tag_id, polarity, created) 
      values ($1, $2, $3, $4, $5) 
      returning *`,
      [userId, propositionTagVote.proposition.id, propositionTagVote.tag.id, propositionTagVote.polarity, now]
    )
      .then(mapSingle(toPropositionTagVote))
  }

  readPropositionTagVoteForId(propositionTagVoteId) {
    return this.database.query(
      `select * from proposition_tag_votes where proposition_tag_vote_id = $1 and deleted is null`,
      [propositionTagVoteId]
    )
      .then(mapSingle(toPropositionTagVote))
  }

  readPropositionTagVote(userId, propositionId, tagId) {
    return this.database.query(
      `select * 
      from proposition_tag_votes 
        where 
              user_id = $1 
          and proposition_id = $2 
          and tag_id = $3 
          and deleted is null
      `,
      [userId, propositionId, tagId]
    )
      .then(mapSingle(this.logger, toPropositionTagVote, 'proposition_tag_votes', {userId, propositionId, tagId}))
  }

  readVotesForPropositionIdAsUser(userId, propositionId) {
    return this.database.query(
      `select * 
      from proposition_tag_votes 
        where 
              user_id = $1 
          and proposition_id = $2 
          and deleted is null
      `,
      [userId, propositionId]
    )
      .then(mapMany(toPropositionTagVote))
  }

  readVotes() {
    return this.database.query(`select * from proposition_tag_votes where deleted is null`)
      .then(mapMany(toPropositionTagVote))
  }

  deletePropositionTagVote(userId, propositionTagVoteId, now) {
    return this.database.query(
      `update proposition_tag_votes 
      set deleted = $1 
      where 
            user_id = $2 
        and proposition_tag_vote_id = $3 
      returning proposition_tag_vote_id
      `,
      [now, userId, propositionTagVoteId]
    )
      .then(({rows: [{proposition_tag_vote_id}]}) => proposition_tag_vote_id)
  }
}
