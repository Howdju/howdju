const forEach = require('lodash/forEach')

const {
  StatementTagVotePolarity
} = require('howdju-common')

const {
  mapMany,
} = require('./util')
const {
  toTag,
  toStatement,
} = require('./orm')

exports.StatementTagsDao = class StatementTagsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readTagsForStatementId(statementId) {
    return this.database.query(
      `
      with 
        statement_tag_ids as (
          select distinct tag_id 
          from statement_tag_votes 
            where 
                  statement_id = $1
              and polarity = $2
              and deleted is null
        )
      select * from tags where tag_id in (select * from statement_tag_ids) and deleted is null
      `,
      [statementId, StatementTagVotePolarity.POSITIVE]
    )
      .then(mapMany(toTag))
  }

  readRecommendedTagsForStatementId(statementId) {
    return this.database.query(
      `
      with 
        tag_scores as (
          select tag_id, score 
          from statement_tag_scores 
            where 
                  statement_id = $1
              and score > 0
              and deleted is null
        )
      select t.* 
      from tags t 
          join tag_scores s using (tag_id)
        where t.deleted is null
      order by s.score desc
      `,
      [statementId]
    )
      .then(mapMany(toTag))
  }

  readStatementsRecommendedForTagId(tagId) {
    return this.database.query(
      `
      with 
        statement_scores as (
          select statement_id, score 
          from statement_tag_scores 
            where 
                  tag_id = $1
              and score > 0
              and deleted is null
        )
      select s.* 
      from statements s 
          join statement_scores ss using (statement_id)
        where s.deleted is null
      order by ss.score desc
      `,
      [tagId]
    )
      .then(mapMany(toTag))
  }

  readTaggedStatementsByVotePolarityAsUser(userId, tagId) {
    return this.database.query(
      `
        select
            s.*
          , v.polarity
        from 
          statement_tag_votes v
            join statements s using (statement_id)
          where 
                v.user_id = $1
            and v.tag_id = $2
            and v.deleted is null
            and s.deleted is null
      `,
      [userId, tagId]
    )
      .then(({rows}) => {
        const statementsByPolarity = {}
        forEach(rows, row => {
          const statement = toStatement(row)
          let statements = statementsByPolarity[row.polarity]
          if (!statements) {
            statementsByPolarity[row.polarity] = statements = []
          }
          statements.push(statement)
        })
        return statementsByPolarity
      })
  }
}
