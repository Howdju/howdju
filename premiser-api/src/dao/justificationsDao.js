const head = require('lodash/head')
const map = require('lodash/map')
const toNumber = require('lodash/toNumber')
const toString = require('lodash/toString')
const forEach = require('lodash/forEach')

const {assert} = require('../util')
const statementCompoundsDao = require('./statementCompoundsDao')
const citationReferencesDao = require('./citationReferencesDao')
const {
  JustificationTargetType,
  VoteTargetType,
  JustificationBasisType,
} = require('../models')
const {
  toJustification
} = require('../orm')
const {query} = require('../db')
const {logger} = require('../logger')

const groupRootJustifications = (rootStatementId, justification_rows) => {
  const rootJustifications = [], counterJustificationsByJustificationId = {}
  for (let justification_row of justification_rows) {
    // There are two types of justifications: those on the (root) statement, and counters
    if (justification_row.target_type === JustificationTargetType.STATEMENT) {
      assert(() => toString(justification_row.target_id) === rootStatementId)
      rootJustifications.push(justification_row)
    } else {
      assert( () => justification_row.target_type === JustificationTargetType.JUSTIFICATION)
      if (!counterJustificationsByJustificationId.hasOwnProperty(justification_row.target_id)) {
        counterJustificationsByJustificationId[justification_row.target_id] = []
      }
      counterJustificationsByJustificationId[justification_row.target_id].push(justification_row)
    }
  }
  return {
    rootJustifications,
    counterJustificationsByJustificationId,
  }
}

class JustificationsDao {

  constructor(statementCompoundsDao, citationReferencesDao) {
    this.statementCompoundsDao = statementCompoundsDao
    this.citationReferencesDao = citationReferencesDao
  }

  readJustificationsWithBasesAndVotesByRootStatementId(authToken, rootStatementId) {
    const sql = `
      select 
          j.*
        , sc.statement_compound_id as basis_statement_compound_id
        , cr.citation_reference_id as basis_citation_reference_id
        , v.vote_id
        , v.polarity AS vote_polarity
        , v.target_type AS vote_target_type
        , v.target_id AS vote_target_id
      from justifications j 
        left join statement_compounds sc on 
              j.basis_type = $5 
          and j.basis_id = sc.statement_compound_id 
        left join citation_references cr on 
              j.basis_type = $4 
          and j.basis_id = cr.citation_reference_id
        left join authentication_tokens auth on auth.token = $2
        left join votes v on 
              v.target_type = $3
          and j.justification_id = v.target_id
          and v.user_id = auth.user_id
          and v.deleted IS NULL
        where 
              j.deleted is null
          and j.root_statement_id = $1
      `
    return Promise.all([
      query(sql, [rootStatementId, authToken, VoteTargetType.JUSTIFICATION, JustificationBasisType.CITATION_REFERENCE, JustificationBasisType.STATEMENT_COMPOUND]),
      this.statementCompoundsDao.readStatementCompoundsByIdForRootStatementId(rootStatementId),
      this.citationReferencesDao.readCitationReferencesByIdForRootStatementId(rootStatementId),
    ])
        .then( ([
            {rows: justification_rows},
            statementCompoundsById,
            citationReferencesById
        ]) => {
          const {rootJustifications, counterJustificationsByJustificationId} =
              groupRootJustifications(rootStatementId, justification_rows)
          return rootJustifications.map(j =>
              toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, citationReferencesById))
        })
  }

  readJustificationsDependentUponStatementId(statementId) {
    const sql = `
      select * from justifications where
           root_statement_id = $1
      union
        select j.* 
        from justifications j 
          join statement_compounds sc on 
                j.basis_type = $2
            and j.basis_id = sc.statement_compound_id
          join statement_compound_atoms using (statement_compound_id)
          join statements scas on
                sca.statement_id = scas.statement_id
            and scas.statement_id = $1
    `
    return query(sql, [statementId, JustificationBasisType.STATEMENT_COMPOUND])
        .then( ({rows}) => map(rows, toJustification))
  }

  readJustificationById(justificationId) {
    return query('select * from justifications where justification_id = $1 and deleted is null', [justificationId])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`More than one justification has ID ${justificationId}`)
          }
          return toJustification(head(rows))
        })
  }

  readJustificationEquivalentTo(justification) {
    const sql = `
      select * from justifications j where
            j.deleted is null
        and j.target_type = $1
        and j.target_id = $2
        and j.polarity = $3
        and j.basis_type = $4
        and j.basis_id = $5
    `
    const args = [
      justification.target.type,
      justification.target.entity.id,
      justification.polarity,
      justification.basis.type,
      justification.basis.entity.id,
    ]
    return query(sql, args)
        .then( ({rows}) => toJustification(head(rows)) )
        .then(equivalentJustification => {
          if (equivalentJustification && equivalentJustification.rootStatementId !== toNumber(justification.rootStatementId)) {
            logger.error(`justification's rootStatementId ${justification.rootStatementId} !== equivalent justification ${equivalentJustification.id}'s rootStatementId ${equivalentJustification.rootStatementId}`)
          }
          return equivalentJustification
        })
  }

  createJustification(justification, userId, now) {
    const sql = `
      insert into justifications (root_statement_id, target_type, target_id, basis_type, basis_id, polarity, creator_user_id, created)
        values ($1, $2, $3, $4, $5, $6, $7, $8) 
        returning *
      `
    const args = [
      justification.rootStatementId,
      justification.target.type,
      justification.target.entity.id,
      justification.basis.type,
      justification.basis.entity.id,
      justification.polarity,
      userId,
      now
    ]

    return query(sql, args).then( ({rows: [row]}) => toJustification(row))
  }

  deleteJustifications(justifications, now) {
    const justificationIds = map(justifications, j => j.id)
    return this.deleteJustificationsById(justificationIds, now)
  }
  deleteJustificationsById(justificationIds, now) {
    return Promise.all(map(justificationIds, id => this.deleteJustificationById(id, now) ))
  }

  deleteJustification(justification, now) {
    return this.deleteJustificationById(justification.id, now)
  }

  deleteJustificationById(justificationId, now) {
    return query('update justifications set deleted = $2 where justification_id = $1 returning justification_id', [justificationId, now])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`More than one (${rows.length}) justifications deleted for ID ${justificationId}`)
          }
          const row = head(rows)
          if (!row) {
            return null
          }
          return row.justification_id
        })
  }

  deleteCounterJustificationsToJustificationIds(justificationIds, now) {
    return query(`
        update justifications set deleted = $1 
        where 
              target_type = $2
          and target_id = any ($3) 
        returning justification_id`,
        [now, JustificationTargetType.JUSTIFICATION, justificationIds]
    ).then( ({rows}) => map(rows, row => row.justification_id))
  }
}

module.exports = new JustificationsDao(statementCompoundsDao, citationReferencesDao)