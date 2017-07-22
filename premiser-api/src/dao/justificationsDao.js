const has = require('lodash/has')
const head = require('lodash/head')
const map = require('lodash/map')
const concat = require('lodash/concat')
const toString = require('lodash/toString')
const forEach = require('lodash/forEach')
const mapValues = require('lodash/mapValues')
const snakeCase = require('lodash/snakeCase')

const {ImpossibleError} = require('../errors')
const statementCompoundsDao = require('./statementCompoundsDao')
const citationReferencesDao = require('./citationReferencesDao')
const {
  JustificationTargetType,
  VoteTargetType,
  JustificationBasisType,
} = require('../models')
const {
  toJustification,
  toStatementCompound,
  toStatementCompoundAtom,
  toCitationReference,
} = require('../orm')
const {query} = require('../db')
const {logger} = require('../logger')
const {groupRootJustifications} = require('./util')

const mapJustificationRows = ({rows}) => {
  // Store the justifications in an array to preserve the order
  const justificationRows = []
  // But keep track of whether we've seen the row before since there may be duplicates after joining with statement compound atoms
  const justificationIds = {}
  const citationReferencesRowsById = {}
  const statementCompoundRowsById = {}
  const statementCompountAtomsByStatementCompoundId = {}
  forEach(rows, row => {
    if (!has(justificationIds, row.justification_id)) {
      justificationRows.push(row)
    }

    if (row.basis_citation_reference_id) {
      citationReferencesRowsById[row.basis_citation_reference_id] = toCitationReference({
        citation_reference_id: row.basis_citation_reference_id,
        quote: row.basis_citation_reference_quote,
        citation_id: row.basis_citation_reference_citation_id,
        citation_text: row.basis_citation_reference_citation_text,
        citation_created: row.basis_citation_reference_created,
        citation_creator_user_id: row.basis_citation_reference_creator_user_id,
      })
    }

    if (row.basis_statement_compound_id) {
      const statementCompoundRow = statementCompoundRowsById[row.basis_statement_compound_id]
      if (!statementCompoundRow) {
        statementCompoundRowsById[row.basis_statement_compound_id] = {
          statement_compound_id: row.basis_statement_compound_id
        }
      }

      const atom = toStatementCompoundAtom({
        statement_compound_id: row.basis_statement_compound_id,
        statement_id: row.basis_statement_compound_atom_statement_id,
        statement_text: row.basis_statement_compound_atom_statement_text,
        statement_created: row.basis_statement_compound_atom_statement_created,
        statement_creator_user_id: row.basis_statement_compound_atom_statement_creator_user_id,
        order_position: row.basis_statement_compound_atom_order_position
      })
      let atoms = statementCompountAtomsByStatementCompoundId[atom.statementCompoundId]
      if (!atoms) {
        statementCompountAtomsByStatementCompoundId[atom.statementCompoundId] = atoms = []
      }
      atoms.push(atom)
    }

  })

  const statementCompoundsById = mapValues(statementCompoundRowsById, (row, id) =>
      toStatementCompound(row, statementCompountAtomsByStatementCompoundId[id])
  )

  return map(justificationRows, row => toJustification(row, null, statementCompoundsById, citationReferencesRowsById))
}

class JustificationsDao {

  constructor(statementCompoundsDao, citationReferencesDao) {
    this.statementCompoundsDao = statementCompoundsDao
    this.citationReferencesDao = citationReferencesDao
  }

  readJustifications(sorts, count, filter) {
    const args = [
        JustificationBasisType.CITATION_REFERENCE,
        JustificationBasisType.STATEMENT_COMPOUND,
    ]
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = [
      'j.deleted is null',
      'cr.deleted is null',
      'c.deleted is null',
      'sc.deleted is null',
    ]
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'justification_id' : snakeCase(sort.property)
      const direction = sort.direction === 'descending' ? 'desc' : 'asc'
      whereSqls.push(`j.${columnName} is not null`)
      orderBySqls.push(`j.${columnName} ${direction}`)
    })
    forEach(filter, (filterValue, filterName) => {
      if (!filterValue) return
      switch (filterName) {
        case 'statementId': {
            args.push(filterValue)
            whereSqls.push(`sca.statement_id = $${args.length}`)
          }
          break
        case 'citationId': {
            args.push(filterValue)
            whereSqls.push(`cr.citation_id = $${args.length}`)
          }
          break
        default:
          throw new ImpossibleError(`Unsupported justification filter: ${filterName}`)
      }
    })
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      with
        limited_justifications as (
          select distinct
              j.*
            , s.statement_id as root_statement_id
            , s.text as root_statement_text
            , s.created as root_statement_created
            , s.creator_user_id as root_statement_creator_id
            , cr.citation_reference_id as basis_citation_reference_id
            , cr.quote as basis_citation_reference_quote
            , c.citation_id as basis_citation_reference_citation_id
            , c.text as basis_citation_reference_citation_text
            , sc.statement_compound_id as basis_statement_compound_id
          from 
            justifications j
              join statements s on j.root_statement_id = s.statement_id
              left join citation_references cr on 
                    j.basis_id = cr.citation_reference_id 
                and j.basis_type = $1
              left join citations c on cr.citation_id = c.citation_id
              left join statement_compounds sc on 
                    j.basis_id = sc.statement_compound_id 
                and j.basis_type = $2
              left join statement_compound_atoms sca on sc.statement_compound_id = sca.statement_compound_id
            where ${whereSql}
          ${orderBySql}
          ${countSql}
        )
      select 
          j.*
        , sca.order_position as basis_statement_compound_atom_order_position
        , scas.statement_id as basis_statement_compound_atom_statement_id
        , scas.text as basis_statement_compound_atom_statement_text
        , scas.created as basis_statement_compound_atom_statement_created
        , scas.creator_user_id as basis_statement_compound_atom_statement_creator_user_id
      from limited_justifications j
          left join statement_compounds sc on j.basis_id = sc.statement_compound_id and j.basis_type = $2
          left join statement_compound_atoms sca on sc.statement_compound_id = sca.statement_compound_id
          left join statements scas on sca.statement_id = scas.statement_id
        where scas.deleted is null
      ${orderBySql}
      `
    return query(sql, args)
        .then(mapJustificationRows)
  }

  readMoreJustifications(sortContinuations, count, filter) {
    const args = [
      JustificationBasisType.CITATION_REFERENCE,
      JustificationBasisType.STATEMENT_COMPOUND,
    ]
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `\nlimit $${args.length}`
    }

    const whereSqls = [
      'j.deleted is null',
      'cr.deleted is null',
      'c.deleted is null',
      'sc.deleted is null',
    ]
    const continuationWhereSqls = []
    const prevWhereSqls = []
    const orderBySqls = []
    forEach(sortContinuations, (sortContinuation, index) => {
      const value = sortContinuation.v
      // The default direction is ascending
      const direction = sortContinuation.d === 'd' ? 'desc' : 'asc'
      // 'id' is a special property name for entities. The column is prefixed by the entity type
      const columnName = sortContinuation.p === 'id' ? 'justification_id' : snakeCase(sortContinuation.p)
      let operator = direction === 'asc' ? '>' : '<'
      args.push(value)
      const currContinuationWhereSql = concat(prevWhereSqls, [`j.${columnName} ${operator} $${args.length}`])
      continuationWhereSqls.push(currContinuationWhereSql.join(' and '))
      prevWhereSqls.push(`j.${columnName} = $${args.length}`)
      whereSqls.push(`j.${columnName} is not null`)
      orderBySqls.push(`j.${columnName} ${direction}`)
    })
    forEach(filter, (filterValue, filterName) => {
      if (!filterValue) return
      switch (filterName) {
        case 'statementId': {
          args.push(filterValue)
          whereSqls.push(`sca.statement_id = $${args.length}`)
        }
          break
        case 'citationId': {
          args.push(filterValue)
          whereSqls.push(`cr.citation_id = $${args.length}`)
        }
          break
        default:
          throw new ImpossibleError(`Unsupported justification filter: ${filterName}`)
      }
    })

    const continuationWhereSql = continuationWhereSqls.length > 0 ?
        `and (
          ${continuationWhereSqls.join('\n or ')}
         )` :
        ''
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      with
        limited_justifications as (
          select distinct
              j.*
            , s.statement_id as root_statement_id
            , s.text as root_statement_text
            , s.created as root_statement_created
            , s.creator_user_id as root_statement_creator_id
            , cr.citation_reference_id as basis_citation_reference_id
            , cr.quote as basis_citation_reference_quote
            , c.citation_id as basis_citation_reference_citation_id
            , c.text as basis_citation_reference_citation_text
            , sc.statement_compound_id as basis_statement_compound_id
          from justifications j
            join statements s on j.root_statement_id = s.statement_id
            left join citation_references cr on j.basis_id = cr.citation_reference_id and j.basis_type = $1
            left join citations c on cr.citation_id = c.citation_id
            left join statement_compounds sc on j.basis_id = sc.statement_compound_id and j.basis_type = $2
            left join statement_compound_atoms sca on sc.statement_compound_id = sca.statement_compound_id
            where 
              ${whereSql}
              ${continuationWhereSql}
          ${orderBySql}
          ${countSql}
        )
      select 
          j.*
        , sca.order_position as basis_statement_compound_atom_order_position
        , scas.statement_id as basis_statement_compound_atom_statement_id
        , scas.text as basis_statement_compound_atom_statement_text
        , scas.created as basis_statement_compound_atom_statement_created
        , scas.creator_user_id as basis_statement_compound_atom_statement_creator_user_id
      from limited_justifications j
          left join statement_compounds sc on j.basis_id = sc.statement_compound_id and j.basis_type = $2
          left join statement_compound_atoms sca on sc.statement_compound_id = sca.statement_compound_id
          left join statements scas on sca.statement_id = scas.statement_id
        where scas.deleted is null
      ${orderBySql}
    `
    return query(sql, args)
        .then(mapJustificationRows)
  }

  readJustificationsWithBasesAndVotesByRootStatementId(authToken, rootStatementId) {
    const sql = `
      select 
          j.*
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
          return map(rootJustifications, j =>
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
          if (equivalentJustification && toString(equivalentJustification.rootStatement.id) !== toString(justification.rootStatement.id)) {
            logger.error(`justification's rootStatement ID ${justification.rootStatement.id} !== equivalent justification ${equivalentJustification.id}'s rootStatement ID ${equivalentJustification.rootStatement.id}`)
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
      justification.rootStatement.id,
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