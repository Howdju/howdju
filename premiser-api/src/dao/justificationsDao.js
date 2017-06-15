const head = require('lodash/head')

const {assert} = require('../util')
const urlsDao = require('./urlsDao')
const {
  JustificationTargetType,
  VoteTargetType,
  JustificationBasisType,
} = require('../models')
const {
  toJustification
} = require('../orm')
const map = require('lodash/map')
const {query} = require('./../db')
const {logger} = require('../logger')

const groupRootJustifications = (rootStatementId, justification_rows) => {
  const rootJustifications = [], counterJustificationsByJustificationId = {}
  for (let justification_row of justification_rows) {
    // There are two types of justifications: those on the (root) statement, and counters
    if (justification_row.target_type === JustificationTargetType.STATEMENT) {
      assert( () => justification_row.target_id === rootStatementId)
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

  constructor(urlsDao) {
    this.urlsDao = urlsDao
  }

  readJustificationsAndVotesByRootStatementId(authToken, rootStatementId) {
    const sql = `
      select 
          j.*
        , s.statement_id as basis_statement_id
        , s.text as basis_statement_text
        
        , r.citation_reference_id as basis_citation_reference_id
        , r.quote as basis_citation_reference_quote
        , c.citation_id as basis_citation_reference_citation_id
        , c.text as basis_citation_reference_citation_text
        
        , v.vote_id
        , v.polarity AS vote_polarity
        , v.target_type AS vote_target_type
        , v.target_id AS vote_target_id
      from justifications j 
        left join statements s ON j.basis_type = 'STATEMENT' AND j.basis_id = s.statement_id
        left join citation_references r ON j.basis_type = 'CITATION_REFERENCE' AND j.basis_id = r.citation_reference_id
        left join citations c USING (citation_id)
        left join authentication_tokens auth ON auth.token = $2
        left join votes v ON 
              v.target_type = $3
          and j.justification_id = v.target_id
          and v.user_id = auth.user_id
          and v.deleted IS NULL
        where 
              j.deleted is null
          and s.deleted is null
          and j.root_statement_id = $1
      `
    return Promise.all([
      query(sql, [rootStatementId, authToken, VoteTargetType.JUSTIFICATION]),
      this.urlsDao.readUrlsByRootStatementId(rootStatementId),
    ])
        .then( ([{rows: justification_rows}, urlsByJustificationId]) => {

          const {rootJustifications, counterJustificationsByJustificationId} =
              groupRootJustifications(rootStatementId, justification_rows)

          return rootJustifications.map(j =>
              toJustification(j, urlsByJustificationId, counterJustificationsByJustificationId))
        })
  }

  readJustificationsDependentUponStatementId(statementId) {
    const sql = `
      select * from justifications where
           root_statement_id = $1
        or basis_type = $2 and basis_id = $1
    `
    return query(sql, [statementId, JustificationBasisType.STATEMENT]).then( ({rows}) => map(rows, toJustification))
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
}

module.exports = new JustificationsDao(urlsDao)