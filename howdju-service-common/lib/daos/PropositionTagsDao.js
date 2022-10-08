const forEach = require('lodash/forEach')

const {
  PropositionTagVotePolarities
} = require('howdju-common')

const {
  mapMany,
} = require('./daosUtil')
const {
  toTag,
  toProposition,
} = require('./orm')

exports.PropositionTagsDao = class PropositionTagsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readTagsForPropositionId(propositionId) {
    return this.database.query(
      'readTagsForPropositionId',
      `
        with
          proposition_tag_ids as (
            select distinct tag_id
            from proposition_tag_votes
              where
                    proposition_id = $1
                and polarity = $2
                and deleted is null
          )
        select * from tags where tag_id in (select * from proposition_tag_ids) and deleted is null
      `,
      [propositionId, PropositionTagVotePolarities.POSITIVE]
    )
      .then(mapMany(toTag))
  }

  readRecommendedTagsForPropositionId(propositionId) {
    return this.database.query(
      'readRecommendedTagsForPropositionId',
      `
        with
          tag_scores as (
            select tag_id, score
            from proposition_tag_scores
              where
                    proposition_id = $1
                and score > 0
                and deleted is null
          )
        select t.*
        from tags t
            join tag_scores s using (tag_id)
          where t.deleted is null
        order by s.score desc
      `,
      [propositionId]
    )
      .then(mapMany(toTag))
  }

  readPropositionsRecommendedForTagId(tagId) {
    return this.database.query(
      'readPropositionsRecommendedForTagId',
      `
        with
          proposition_scores as (
            select proposition_id, score
            from proposition_tag_scores
              where
                    tag_id = $1
                and score > 0
                and deleted is null
          )
        select s.*
        from propositions s
            join proposition_scores ss using (proposition_id)
          where s.deleted is null
        order by ss.score desc
      `,
      [tagId]
    )
      .then(mapMany(toProposition))
  }

  readTaggedPropositionsByVotePolarityAsUser(userId, tagId) {
    return this.database.query(
      'readTaggedPropositionsByVotePolarityAsUser',
      `
        select
            s.*
          , v.polarity
        from
          proposition_tag_votes v
            join propositions s using (proposition_id)
          where
                v.user_id = $1
            and v.tag_id = $2
            and v.deleted is null
            and s.deleted is null
      `,
      [userId, tagId]
    )
      .then(({rows}) => {
        const propositionsByPolarity = {}
        forEach(rows, row => {
          const proposition = toProposition(row)
          let propositions = propositionsByPolarity[row.polarity]
          if (!propositions) {
            propositionsByPolarity[row.polarity] = propositions = []
          }
          propositions.push(proposition)
        })
        return propositionsByPolarity
      })
  }
}
