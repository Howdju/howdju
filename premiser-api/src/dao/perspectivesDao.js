const Promise = require('bluebird')
const forEach = require('lodash/forEach')
const join = require('lodash/join')
const map = require('lodash/map')
const range = require('lodash/range')

const {JustificationTargetType, VoteTargetType} = require('../models')
const {toJustification} = require('../orm')
const {query} = require('../db')
const statementsDao = require('./statementsDao')
const {groupRootJustifications} = require('./util')
const statementCompoundsDao = require('./statementCompoundsDao')
const citationReferencesDao = require('./citationReferencesDao')


class PerspectivesDao {
  constructor(statementsDao, statementCompoundsDao, citationReferencesDao) {
    this.statementsDao = statementsDao
    this.statementCompoundsDao = statementCompoundsDao
    this.citationReferencesDao = citationReferencesDao
  }

  readFeaturedPerspectivesWithVotesForOptionalUserId(userId) {
    const votesSelectSql = userId ? `
        , v.vote_id
        , v.polarity AS vote_polarity
        , v.target_type AS vote_target_type
        , v.target_id AS vote_target_id
        ` :
        ''
    const votesJoinSql = userId ? `
        left join votes v on 
              v.target_type = $1
          and j.justification_id = v.target_id
          and v.user_id = $2
          and v.deleted IS NULL
        ` :
        ''
    const perspectiveJustificationsSql = `
      select 
          p.perspective_id
        , p.creator_user_id as perspective_creator_user_id
        , j.*
        ${votesSelectSql}
      from perspectives p 
        join perspective_justifications pj on
              p.is_featured
          and p.deleted is null
          and p.perspective_id = pj.perspective_id
        join justifications j on
              j.deleted is null
          and pj.justification_id = j.justification_id
        ${votesJoinSql}
    `
    const args = userId ? [VoteTargetType.JUSTIFICATION, userId] : undefined
    return query(perspectiveJustificationsSql, args)
        .then( ({rows}) => {
          if (rows.length > 0) {
            return this._readFeaturedPerspectivesCounterJustifications(userId, 1, rows)
          }
          this._addStatementAndMapPerspectives(rows)
        })
  }

  _readFeaturedPerspectivesCounterJustifications(userId, targetHeight, rows) {
    const votesSelectSql = userId ? `
        , v.vote_id
        , v.polarity AS vote_polarity
        , v.target_type AS vote_target_type
        , v.target_id AS vote_target_id
        ` :
        ''
    const votesJoinSql = userId ? `
        left join votes v on 
              v.target_type = $1
          and j${targetHeight}.justification_id = v.target_id
          and v.user_id = $2
          and v.deleted IS NULL
        ` :
        ''
    const justificationsJoinSqls = map(range(1, targetHeight+1), currentHeight => `join justifications j${currentHeight} on
                    j${currentHeight-1}.target_type = $3
                and j${currentHeight-1}.target_id = j${currentHeight}.justification_id
                and j${currentHeight}.deleted is null`)
    const justificationsJoinSql = join(justificationsJoinSqls, '\n')
    const counteredJustificationsSql = `
            select 
                p.perspective_id
              , j${targetHeight}.*
              ${votesSelectSql}
            from perspectives p 
              join perspective_justifications pj on
                    p.is_featured
                and p.deleted is null
                and p.perspective_id = pj.perspective_id
              join justifications j0 on 
                    pj.justification_id = j0.justification_id
                and j0.deleted is null
              ${justificationsJoinSql}
              ${votesJoinSql}
          `
    return query(counteredJustificationsSql, [VoteTargetType.JUSTIFICATION, userId, JustificationTargetType.JUSTIFICATION])
        .then( ({rows: newRows}) => {
          if (newRows.length > 0) {
            return this._readFeaturedPerspectivesCounterJustifications(userId, targetHeight + 1, rows.concat(newRows))
          }
          return this._addStatementAndMapPerspectives(rows)
        })
  }

  _addStatementAndMapPerspectives(rows) {
    const perspectivesById = {}
    const rootStatementIdByPerspectiveId = {}
    forEach(rows, row => {
      let perspective = perspectivesById[row.perspective_id]
      if (!perspective) {
        perspectivesById[row.perspective_id] = perspective = {id: row.perspective_id, justifications: []}
      }
      if (row.perspective_creator_user_id) {
        perspective.creatorUserId = row.perspective_creator_user_id
      }
      if (!rootStatementIdByPerspectiveId[perspective.id]) {
        rootStatementIdByPerspectiveId[perspective.id] = row.root_statement_id
      }
    })

    return Promise.all(map(rootStatementIdByPerspectiveId, (rootStatementId, perspectiveId) => Promise.all([
          this.statementCompoundsDao.readStatementCompoundsByIdForRootStatementId(rootStatementId),
          this.citationReferencesDao.readCitationReferencesByIdForRootStatementId(rootStatementId),
    ])
        .then( ([
            statementCompoundsById,
            citationReferencesById
        ]) => {
          const {rootJustifications, counterJustificationsByJustificationId} = groupRootJustifications(rootStatementId, rows)
          const justifications = map(rootJustifications, j =>
              toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, citationReferencesById))
          return Promise.props({
            perspectiveId,
            statement: this.statementsDao.readStatementById(rootStatementId),
            justifications,
          })
        })
    ))
        .then( rootStatementAndPerspectiveIds => {
          return map(rootStatementAndPerspectiveIds, ({perspectiveId, statement, justifications}) => {
            const perspective = perspectivesById[perspectiveId]
            perspective.statement = statement
            perspective.justifications = justifications
            return perspective
          })
        })
  }
}

module.exports = new PerspectivesDao(statementsDao, statementCompoundsDao, citationReferencesDao)