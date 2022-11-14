const Promise = require('bluebird')
const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const join = require('lodash/join')
const map = require('lodash/map')
const range = require('lodash/range')

const {
  JustificationBasisTypes,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
} = require('howdju-common')
const {toJustification} = require('../orm')
const propositionsDao = require('./propositionsDao')
const {groupRootJustifications} = require('./util')
const propositionCompoundsDao = require('./propositionCompoundsDao')
const writQuotesDao = require('./writQuotesDao')


class PerspectivesDao {
  constructor(database, propositionsDao, propositionCompoundsDao, writQuotesDao) {
    this.database = database
    this.propositionsDao = propositionsDao
    this.propositionCompoundsDao = propositionCompoundsDao
    this.writQuotesDao = writQuotesDao
  }

  readFeaturedPerspectivesWithVotesForOptionalUserId(userId) {
    const votesSelectSql = userId ? `
        , v.justification_vote_id
        , v.polarity AS vote_polarity
        , v.justification_id AS vote_justification_id
        ` :
      ''
    const votesJoinSql = userId ? `
        left join justification_votes v on
              j.justification_id = v.justification_id
          and v.user_id = $1
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
    const args = userId ? [userId] : undefined
    return this.database.query('readFeaturedPerspectivesWithVotesForOptionalUserId', perspectiveJustificationsSql, args)
      .then( ({rows}) => {
        const transitiveRowsPromise =
          this._readFeaturedPerspectiveJustificationTransitiveJustifications(userId, 1, 4, rows)
        if (rows.length > 0) {
          // TODO(1,2,3): remove exception
          // eslint-disable-next-line promise/no-nesting
          return Promise.all([
            transitiveRowsPromise,
            this._readFeaturedPerspectivesCounteredJustifications(userId, 1, rows),
          ])
            // TODO(1,2,3): remove exception
            // eslint-disable-next-line promise/no-nesting
            .then( ([transitiveRows, counteredRows]) => concat(transitiveRows, counteredRows))
        }
        return transitiveRowsPromise
      })
      .then(rows => this._addPropositionAndMapPerspectives(rows))
  }

  /** Search up to maxDepth jumps, via proposition compounds, from the perspective's justifications
   * to find any justifications also targeting the perspective's proposition
   *
   * To allow us to include justifications in the perspective that are not directly rooted in the
   * perspective's proposition.
   *
   * How to also go through counters?  If we ever get to a justification whose root proposition is the perspective's
   * proposition, then it is deterministic to find a path
   */
  _readFeaturedPerspectiveJustificationTransitiveJustifications(userId, targetDepth, maxDepth, rows) {
    const args = [
      userId,
      JustificationTargetTypes.PROPOSITION,
      JustificationBasisTypes.PROPOSITION_COMPOUND,
      JustificationRootTargetTypes.PROPOSITION,
    ]
    const votesSelectSql = userId ? `
        , v.justification_vote_id
        , v.polarity AS vote_polarity
        , v.justification_id AS vote_justification_id
        ` :
      ''
    const votesJoinSql = userId ? `
        left join justification_votes v on
              j${targetDepth}.justification_id = v.justification_id
          and v.user_id = $1
          and v.deleted IS NULL
        ` :
      ''
    const transitiveSql = map(range(1, targetDepth+1), currentDepth => `
      join propositions s${currentDepth} on
            j${currentDepth-1}.target_id = s${currentDepth}.proposition_id
        and j${currentDepth-1}.target_type = $2
        and s${currentDepth}.deleted is null
      join proposition_compound_atoms sca${currentDepth} on
            s${currentDepth}.proposition_id = sca${currentDepth}.proposition_compound_id
      join proposition_compounds sc${currentDepth} on
            sca${currentDepth}.proposition_compound_id = sc${currentDepth}.proposition_compound_id
        and sc${currentDepth}.deleted is null
      join justifications j${currentDepth} on
            sc${currentDepth}.proposition_compound_id = j${currentDepth}.target_id
        and j${currentDepth}.basis_type = $3
        and j${currentDepth}.deleted is null
        and j${currentDepth}.root_target_type = $4
        and p.proposition_id = j${currentDepth}.root_target_id

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
    return this.database.query('_readFeaturedPerspectiveJustificationTransitiveJustifications', sql, args)
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
   * BUG: this only works if the justifications are guaranteed to be rooted in the perspective's proposition.  Otherwise
   * we could just be grabbing counters that have nothing to do with the perspective.
   *
   * We should only use the other query
   * */
  _readFeaturedPerspectivesCounteredJustifications(userId, targetHeight, rows) {
    const votesSelectSql = userId ? `
        , v.justification_vote_id
        , v.polarity AS vote_polarity
        , v.justification_id AS vote_justification_id
        ` :
      ''
    const votesJoinSql = userId ? `
        left join justification_votes v on
              j${targetHeight}.justification_id = v.justification_id
          and v.user_id = $1
          and v.deleted IS NULL
        ` :
      ''
    const justificationsJoinSqls = map(range(1, targetHeight+1), currentHeight => `join justifications j${currentHeight} on
                    j${currentHeight-1}.target_type = $2
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
    return this.database.query(
      '_readFeaturedPerspectivesCounteredJustifications',
      counteredJustificationsSql,
      [userId, JustificationTargetTypes.JUSTIFICATION]
    )
      .then( ({rows: newRows}) => {
        if (newRows.length > 0) {
          return this._readFeaturedPerspectivesCounteredJustifications(userId, targetHeight + 1, rows.concat(newRows))
        }
        return this._addPropositionAndMapPerspectives(rows)
      })
  }

  _addPropositionAndMapPerspectives(rows) {
    const perspectivesById = {}
    const rootPropositionIdByPerspectiveId = {}
    forEach(rows, row => {
      let perspective = perspectivesById[row.perspective_id]
      if (!perspective) {
        perspectivesById[row.perspective_id] = perspective = {id: row.perspective_id, justifications: []}
      }
      if (row.perspective_creator_user_id) {
        perspective.creatorUserId = row.perspective_creator_user_id
      }
      if (!rootPropositionIdByPerspectiveId[perspective.id]) {
        rootPropositionIdByPerspectiveId[perspective.id] = row.root_proposition_id
      }
    })

    return Promise.all(map(rootPropositionIdByPerspectiveId, (rootPropositionId, perspectiveId) =>
      Promise.all([
        this.propositionCompoundsDao.readPropositionCompoundsByIdForRootPropositionId(rootPropositionId),
        this.writQuotesDao.readWritQuotesByIdForRootPropositionId(rootPropositionId),
      ])
        .then( ([
          propositionCompoundsById,
          writQuotesById,
        ]) => {
          const {rootJustifications, counterJustificationsByJustificationId} = groupRootJustifications(JustificationRootTargetTypes.PROPOSITION, rootPropositionId, rows)
          const justifications = map(rootJustifications, j =>
            toJustification(j, counterJustificationsByJustificationId, propositionCompoundsById, writQuotesById))
          return Promise.props({
            perspectiveId,
            proposition: this.propositionsDao.readPropositionForId(rootPropositionId),
            justifications,
          })
        })
    ))
      .then( rootPropositionAndPerspectiveIds => {
        return map(rootPropositionAndPerspectiveIds, ({perspectiveId, proposition, justifications}) => {
          const perspective = perspectivesById[perspectiveId]
          perspective.proposition = proposition
          perspective.justifications = justifications
          return perspective
        })
      })
  }
}

module.exports = new PerspectivesDao(propositionsDao, propositionCompoundsDao, writQuotesDao)
