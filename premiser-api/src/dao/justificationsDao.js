const clone = require('lodash/clone')
const concat = require('lodash/concat')
const findIndex = require('lodash/findIndex')
const forEach = require('lodash/forEach')
const get = require('lodash/get')
const has = require('lodash/has')
const head = require('lodash/head')
const join = require('lodash/join')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const snakeCase = require('lodash/snakeCase')
const sortBy = require('lodash/sortBy')
const toString = require('lodash/toString')
const values = require('lodash/values')

const {ImpossibleError, EntityNotFoundError} = require('../errors')
const statementCompoundsDao = require('./statementCompoundsDao')
const citationReferencesDao = require('./citationReferencesDao')
const {
  JustificationTargetType,
  JustificationBasisType,
  VoteTargetType,
  SortDirection,
  ContinuationSortDirection,
  negateRootPolarity,
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
const {DatabaseSortDirection} = require('./daoModels')

const mapJustificationRows = (rows, idPrefix = '', prefix = '') => {
  const justificationRowsById = {}
  // Keep track of whether we've seen the row before since there may be duplicates after joining with statement compound atoms
  const justificationIds = {}
  const citationReferencesRowsById = {}
  const statementCompoundRowsById = {}
  const statementCompoundAtomsByStatementCompoundId = {}
  forEach(rows, row => {
    const rowId = row[idPrefix + 'justification_id']
    if (!has(justificationIds, rowId)) {
      justificationRowsById[rowId] = {
        justification_id: rowId,
        root_statement_id: row[prefix + 'root_statement_id'],
        root_polarity: row[prefix + 'root_polarity'],
        root_statement_text: row[prefix + 'root_statement_text'],
        root_statement_created: row[prefix + 'root_statement_created'],
        root_statement_creator_id: row[prefix + 'root_statement_creator_id'],
        target_type: row[prefix + 'target_type'],
        target_id: row[prefix + 'target_id'],
        basis_type: row[prefix + 'basis_type'],
        basis_id: row[prefix + 'basis_id'],
        polarity: row[prefix + 'polarity'],
        creator_user_id: row[prefix + 'creator_user_id'],
        created: row[prefix + 'created'],
      }
    }

    if (row[prefix + 'basis_citation_reference_id']) {
      citationReferencesRowsById[row[prefix + 'basis_citation_reference_id']] = toCitationReference({
        citation_reference_id: row[prefix + 'basis_citation_reference_id'],
        quote: row[prefix + 'basis_citation_reference_quote'],
        citation_id: row[prefix + 'basis_citation_reference_citation_id'],
        citation_text: row[prefix + 'basis_citation_reference_citation_text'],
        citation_created: row[prefix + 'basis_citation_reference_created'],
        citation_creator_user_id: row[prefix + 'basis_citation_reference_creator_user_id'],
      })
    }

    if (row[prefix + 'basis_statement_compound_id']) {
      const statementCompoundRow = statementCompoundRowsById[row[prefix + 'basis_statement_compound_id']]
      if (!statementCompoundRow) {
        statementCompoundRowsById[row[prefix + 'basis_statement_compound_id']] = {
          statement_compound_id: row[prefix + 'basis_statement_compound_id']
        }
      }

      const statementCompoundId = row[prefix + 'basis_statement_compound_id']
      let atomsByStatementId = statementCompoundAtomsByStatementCompoundId[statementCompoundId]
      if (!atomsByStatementId) {
        statementCompoundAtomsByStatementCompoundId[statementCompoundId] = atomsByStatementId = {}
      }
      if (!has(atomsByStatementId, row[prefix + 'basis_statement_compound_atom_statement_id'])) {
        const atom = toStatementCompoundAtom({
          statement_compound_id: row[prefix + 'basis_statement_compound_id'],
          statement_id: row[prefix + 'basis_statement_compound_atom_statement_id'],
          statement_text: row[prefix + 'basis_statement_compound_atom_statement_text'],
          statement_created: row[prefix + 'basis_statement_compound_atom_statement_created'],
          statement_creator_user_id: row[prefix + 'basis_statement_compound_atom_statement_creator_user_id'],
          order_position: row[prefix + 'basis_statement_compound_atom_order_position'],
        })
        atomsByStatementId[atom.statement.id] = atom
      }
    }
  })

  const statementCompoundsById = mapValues(statementCompoundRowsById, (row, id) =>
      toStatementCompound(row, statementCompoundAtomsByStatementCompoundId[id])
  )

  return mapValues(justificationRowsById, row => toJustification(row, null, statementCompoundsById, citationReferencesRowsById))
}

const makeReadJustificationsQuery = (sorts, count, filters, initialArgs, isContinuation = false) => {
  const args = clone(initialArgs)
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
  const sortPropertyMemberName = isContinuation ? 'p' : 'property'
  const sortDirectionMemberName = isContinuation ? 'd' : 'direction'
  forEach(sorts, sort => {

    // The default direction is ascending, so if it is missing that's ok
    const sortDirection = get(sort, sortDirectionMemberName)
    const isDescending = isContinuation ? sortDirection === ContinuationSortDirection.DESCENDING : SortDirection.DESCENDING
    const direction = isDescending ?
        DatabaseSortDirection.DESCENDING :
        DatabaseSortDirection.ASCENDING

    const sortProperty = get(sort, sortPropertyMemberName)
    // 'id' is a special property name for entities. The column is prefixed by the entity type
    const columnName = sortProperty === 'id' ? 'justification_id' : snakeCase(sortProperty)

    whereSqls.push(`j.${columnName} is not null`)
    orderBySqls.push(`j.${columnName} ${direction}`)

    if (isContinuation) {
      let operator = direction === 'asc' ? '>' : '<'
      const value = sort.v
      args.push(value)
      const currContinuationWhereSql = concat(prevWhereSqls, [`j.${columnName} ${operator} $${args.length}`])
      continuationWhereSqls.push(currContinuationWhereSql.join(' and '))
      prevWhereSqls.push(`j.${columnName} = $${args.length}`)
    }
  })
  forEach(filters, (filterValue, filterName) => {
    // Note, some filters are incompatible, such as statementId or statementCompoundId and citationRefererenceId.
    // statementId and statementCompoundId may be incompatible if the statementId doesn't appear in any compound having
    // the statementCompoundId
    if (!filterValue) return
    switch (filterName) {
      case 'statementId':
        // Must be handled below because it needs an add'l with clause
        break
      case 'statementCompoundId': {
          args.push(filterValue)
          whereSqls.push(`sc.statement_compound_id = $${args.length}`)
        }
        break
      case 'citationReferenceId': {
          args.push(filterValue)
          whereSqls.push(`cr.citation_reference_id = $${args.length}`)
        }
        break
      case 'citationId': {
          args.push(filterValue)
          whereSqls.push(`c.citation_id = $${args.length}`)
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

  const additionalWithClauses = []
  const additionalJoinClauses = []
  if (filters.statementId) {
    args.push(filters.statementId)
    const statementLimitedJustificationIdsSql = `
      statement_limited_justification_ids as (
        select distinct justification_id
        from justifications j
              join statement_compounds sc on 
                    j.basis_id = sc.statement_compound_id 
                and j.basis_type = $2
              join statement_compound_atoms sca on
                    sc.statement_compound_id = sca.statement_compound_id
                and sca.statement_id = $${args.length}
      )
    `
    additionalWithClauses.push(statementLimitedJustificationIdsSql)
    additionalJoinClauses.push(`join statement_limited_justification_ids using (justification_id)`)
  }

  const limitedJustificationsSql = `
      select distinct
          j.*
        , s.text as root_statement_text
        , s.created as root_statement_created
        , s.creator_user_id as root_statement_creator_id
        , cr.citation_reference_id as basis_citation_reference_id
        , cr.quote as basis_citation_reference_quote
        , c.citation_id as basis_citation_reference_citation_id
        , c.text as basis_citation_reference_citation_text
        , sc.statement_compound_id as basis_statement_compound_id
      from justifications j
          ${join(additionalJoinClauses, '\n')}
          join statements s on j.root_statement_id = s.statement_id
          left join citation_references cr on 
                j.basis_id = cr.citation_reference_id 
            and j.basis_type = $1
          left join citations c on cr.citation_id = c.citation_id
          left join statement_compounds sc on 
                j.basis_id = sc.statement_compound_id 
            and j.basis_type = $2
        where 
          ${whereSql}
          ${continuationWhereSql}
      ${orderBySql}
      ${countSql}
    `

  return {
    args,
    limitedJustificationsSql,
    additionalWithClauses,
    orderBySql,
  }
}

const getTargetRootPolarity = justification =>
  query('select root_polarity from justifications where justification_id = $1', [justification.target.entity.id])
      .then( ({rows}) => {
        if (rows.length < 1) {
          throw new EntityNotFoundError(`Could not create justification because target justification having ID ${justification.target.id} did not exist`)
        } else if (rows.length > 1) {
          logger.error(`while creating justification, found more than one target justification having ID ${justification.target.id}`)
        }

        const {root_polarity} = head(rows)
        return root_polarity
      })

class JustificationsDao {

  constructor(statementCompoundsDao, citationReferencesDao) {
    this.statementCompoundsDao = statementCompoundsDao
    this.citationReferencesDao = citationReferencesDao
  }

  readJustifications(sorts, count, filters, isContinuation = false) {
    const {
      args: justificationsArgs,
      limitedJustificationsSql: justificationsLimitedJustificationsSql,
      additionalWithClauses: justificationsAdditionalWithClauses,
      orderBySql: justificationsOrderBySql,
    } = makeReadJustificationsQuery(sorts, count, filters, [
      JustificationBasisType.CITATION_REFERENCE,
      JustificationBasisType.STATEMENT_COMPOUND,
    ], isContinuation)
    const justificationsAdditionalWithClausesSql = justificationsAdditionalWithClauses.length > 0 ?
        join(map(justificationsAdditionalWithClauses, c => c + ',\n')) :
        ''
    const justificationsSql = `
      with
        ${justificationsAdditionalWithClausesSql}
        limited_justifications as (
          ${justificationsLimitedJustificationsSql}
        )
      select 
          j.*
        , sca.order_position as basis_statement_compound_atom_order_position
        , scas.statement_id as basis_statement_compound_atom_statement_id
        , scas.text as basis_statement_compound_atom_statement_text
        , scas.created as basis_statement_compound_atom_statement_created
        , scas.creator_user_id as basis_statement_compound_atom_statement_creator_user_id
      from limited_justifications j
          left join statement_compound_atoms sca on j.basis_statement_compound_id = sca.statement_compound_id
          left join statements scas on sca.statement_id = scas.statement_id
        where scas.deleted is null
      ${justificationsOrderBySql}
      `

    const {
      args: targetJustificationsArgs,
      limitedJustificationsSql: targetJustificationsLimitedJustificationsSql,
      additionalWithClauses: targetJustificationsAdditionalWithClauses,
      orderBySql: targetJustificationsOrderBySql,
    } = makeReadJustificationsQuery(sorts, count, filters, [
      JustificationBasisType.CITATION_REFERENCE,
      JustificationBasisType.STATEMENT_COMPOUND,
      JustificationTargetType.JUSTIFICATION,
    ], isContinuation)
    const targetJustificationsAdditionalWithClausesSql = targetJustificationsAdditionalWithClauses.length > 0 ?
        join(map(targetJustificationsAdditionalWithClauses, c => c + ',\n')) :
        ''
    const targetJustificationsSql = `
      with
        ${targetJustificationsAdditionalWithClausesSql}
        limited_justifications as (
          ${targetJustificationsLimitedJustificationsSql}
        )
      select 
         -- We don't use this, but just for completeness
          j.justification_id
                 
        , tj.justification_id as target_justification_id
        , tj.root_statement_id as target_justification_root_statement_id
        , tj.root_polarity as target_justification_root_polarity
        , tj.target_type as target_justification_target_type
        , tj.target_id as target_justification_target_id
        , tj.basis_type as target_justification_basis_type
        , tj.basis_id as target_justification_basis_id
        , tj.polarity as target_justification_polarity
        , tj.creator_user_id as target_justification_creator_user_id
        , tj.created as target_justification_created
        
        , cr.citation_reference_id as target_justification_basis_citation_reference_id
        , cr.quote as target_justification_basis_citation_reference_quote
        , c.citation_id as target_justification_basis_citation_reference_citation_id
        , c.text as target_justification_basis_citation_reference_citation_text
        
        , sc.statement_compound_id as target_justification_basis_statement_compound_id
        , sca.order_position as target_justification_basis_statement_compound_atom_order_position
        , scas.statement_id as target_justification_basis_statement_compound_atom_statement_id
        , scas.text as target_justification_basis_statement_compound_atom_statement_text
        , scas.created as target_justification_basis_statement_compound_atom_statement_created
        , scas.creator_user_id as target_justification_basis_statement_compound_atom_statement_creator_user_id
      from limited_justifications j
          join justifications tj on 
                j.target_id = tj.justification_id 
            and j.target_type = $3
          left join citation_references cr on 
                tj.basis_id = cr.citation_reference_id 
            and tj.basis_type = $1
          left join citations c on cr.citation_id = c.citation_id
          left join statement_compounds sc on tj.basis_id = sc.statement_compound_id and tj.basis_type = $2
          left join statement_compound_atoms sca on sc.statement_compound_id = sca.statement_compound_id
          left join statements scas on sca.statement_id = scas.statement_id
        where scas.deleted is null
      ${targetJustificationsOrderBySql}
      `
    return Promise.all([
      query(justificationsSql, justificationsArgs),
      query(targetJustificationsSql, targetJustificationsArgs),
    ])
        .then( ([{rows: justificationRows}, {rows: targetJustificationRows}]) => {
          const justificationsById = mapJustificationRows(justificationRows)
          const targetJustificationsById = mapJustificationRows(targetJustificationRows, 'target_', 'target_justification_')
          forEach(justificationsById, justification => {
            if (justification.target.type !== JustificationTargetType.JUSTIFICATION) return
            const target = targetJustificationsById[justification.target.entity.id]
            justification.target.entity = target
          })

          let justifications = values(justificationsById)
          // re-sort the justifications by the query order
          justifications = sortBy(justifications, j => findIndex(justificationRows, jr => toString(jr.justification_id) === j.id))
          return justifications
        })
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
          join statement_compound_atoms sca using (statement_compound_id)
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

    let rootPolarity
    switch (justification.target.type) {
      case JustificationTargetType.STATEMENT:
        // root justifications have root polarity equal to their polarity
        rootPolarity = justification.polarity
        break
      case JustificationTargetType.JUSTIFICATION:
        rootPolarity = getTargetRootPolarity(justification)
            .then(rootPolarity => negateRootPolarity(rootPolarity))
        break
      default:
        throw new ImpossibleError(`Cannot create justification because had unsupported target type: ${justification.target.type}`)
    }

    return Promise.resolve(rootPolarity).then(rootPolarity => {
      const sql = `
      insert into justifications
        (root_statement_id, root_polarity, target_type, target_id, basis_type, basis_id, polarity, creator_user_id, created)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning *
      `
      const args = [
        justification.rootStatement.id,
        rootPolarity,
        justification.target.type,
        justification.target.entity.id,
        justification.basis.type,
        justification.basis.entity.id,
        justification.polarity,
        userId,
        now,
      ]

      return query(sql, args).then( ({rows: [row]}) => toJustification(row))
    })
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