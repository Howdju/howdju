const Promise = require('bluebird')
const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const join = require('lodash/join')
const map = require('lodash/map')
const range = require('lodash/range')

const {
  VoteTargetType,
  JustificationBasisType,
  JustificationTargetType,
} = require('howdju-common')
const {toJustification} = require('../orm')
const statementsDao = require('./statementsDao')
const {groupRootJustifications} = require('./util')
const statementCompoundsDao = require('./statementCompoundsDao')
const writingQuotesDao = require('./writingQuotesDao')


class PerspectivesDao {
  constructor(database, statementsDao, statementCompoundsDao, writingQuotesDao) {
    this.database = database
    this.statementsDao = statementsDao
    this.statementCompoundsDao = statementCompoundsDao
    this.writingQuotesDao = writingQuotesDao
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
    return this.database.query(perspectiveJustificationsSql, args)
      .then( ({rows}) => {
        const transitiveRowsPromise =
          this._readFeaturedPerspectiveJustificationTransitiveJustifications(userId, 1, 4, rows)
        if (rows.length > 0) {
          return Promise.all([
            transitiveRowsPromise,
            this._readFeaturedPerspectivesCounteredJustifications(userId, 1, rows),
          ])
            .then( ([transitiveRows, counteredRows]) => concat(transitiveRows, counteredRows))
        }
        return transitiveRowsPromise
      })
      .then(rows => this._addStatementAndMapPerspectives(rows))
  }

  /** Search up to maxDepth jumps, via statement compounds, from the perspective's justifications
   * to find any justifications also targeting the perspective's statement
   *
   * To allow us to include justifications in the perspective that are not directly rooted in the
   * perspective's statement.
   *
   * How to also go through counters?  If we ever get to a justification whose root statement is the perspective's
   * statement, then it is deterministic to find a path
   */
  _readFeaturedPerspectiveJustificationTransitiveJustifications(userId, targetDepth, maxDepth, rows) {
    const args = [
      VoteTargetType.JUSTIFICATION,
      userId,
      JustificationTargetType.STATEMENT,
      JustificationBasisType.STATEMENT_COMPOUND,
    ]
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
          and j${targetDepth}.justification_id = v.target_id
          and v.user_id = $2
          and v.deleted IS NULL
        ` :
      ''
    const transitiveSql = map(range(1, targetDepth+1), currentDepth => `
      join statements s${currentDepth} on
            j${currentDepth-1}.target_id = s${currentDepth}.statement_id
        and j${currentDepth-1}.target_type = $3
        and s${currentDepth}.deleted is null
      join statement_compound_atoms sca${currentDepth} on
            s${currentDepth}.statement_id = sca${currentDepth}.statement_compound_id
      join statement_compounds sc${currentDepth} on
            sca${currentDepth}.statement_compound_id = sc${currentDepth}.statement_compound_id
        and sc${currentDepth}.deleted is null
      join justifications j${currentDepth} on
            sc${currentDepth}.statement_compound_id = j${currentDepth}.target_id
        and j${currentDepth}.basis_type = $4
        and j${currentDepth}.deleted is null
        and p.statement_id = j${currentDepth}.root_statement_id
        
    `)
    const sql = `
      select 
          p.perspective_id
        , j${targetDepth}.*
        ${votesSelectSql}
      from perspectives p 
          join perspective_justifications pj on
                p.is_featured
            and p.deleted is null
            and p.perspective_id = pj.perspective_id
          join justifications j0 on 
                pj.justification_id = j0.justification_id
            and j0.deleted is null
          ${transitiveSql}
          ${votesJoinSql}
    `
    return this.database.query(sql, args)
      .then( ({rows: newRows}) => {

        const combinedRows = concat(rows, newRows)
        if (targetDepth === maxDepth) {
          return combinedRows
        }
        return this._readFeaturedPerspectiveJustificationTransitiveJustifications(userId, targetDepth+1, maxDepth, combinedRows)
      })
  }


  /** Starting from the perspective's justifications, read countered justifications until there are no more.
   *
   * BUG: this only works if the justifications are guaranteed to be rooted in the perspective's statement.  Otherwise
   * we could just be grabbing counters that have nothing to do with the perspective.
   *
   * We should only use the other query
   * */
  _readFeaturedPerspectivesCounteredJustifications(userId, targetHeight, rows) {
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
    return this.database.query(counteredJustificationsSql, [VoteTargetType.JUSTIFICATION, userId, JustificationTargetType.JUSTIFICATION])
      .then( ({rows: newRows}) => {
        if (newRows.length > 0) {
          return this._readFeaturedPerspectivesCounteredJustifications(userId, targetHeight + 1, rows.concat(newRows))
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

    return Promise.all(map(rootStatementIdByPerspectiveId, (rootStatementId, perspectiveId) =>
      Promise.all([
        this.statementCompoundsDao.readStatementCompoundsByIdForRootStatementId(rootStatementId),
        this.writingQuotesDao.readWritingQuotesByIdForRootStatementId(rootStatementId),
      ])
        .then( ([
          statementCompoundsById,
          writingQuotesById
        ]) => {
          const {rootJustifications, counterJustificationsByJustificationId} = groupRootJustifications(rootStatementId, rows)
          const justifications = map(rootJustifications, j =>
            toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, writingQuotesById))
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

module.exports = new PerspectivesDao(statementsDao, statementCompoundsDao, writingQuotesDao)