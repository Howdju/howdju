const clone = require('lodash/clone')
const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const has = require('lodash/has')
const head = require('lodash/head')
const join = require('lodash/join')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const Promise = require('bluebird')
const snakeCase = require('lodash/snakeCase')
const toString = require('lodash/toString')

const {
  JustificationTargetType,
  JustificationBasisType,
  JustificationPolarity,
  VoteTargetType,
  SortDirection,
  negateRootPolarity,
  newImpossibleError,
  assert,
} = require('howdju-common')

const {
  toJustification,
  toStatementCompound,
  toStatementCompoundAtom,
  toWritQuote,
} = require('./orm')
const {EntityNotFoundError} = require('../serviceErrors')
const {groupRootJustifications} = require('./util')
const {DatabaseSortDirection} = require('./daoModels')

/** Directly return an object of the justifications keyed by their ID */
const mapJustificationRowsById = (rows, prefix = '') => {
  const [justificationsById] = mapJustificationRowsWithOrdering(rows, prefix)
  return justificationsById
}

/** Use the ordering to return the justifications as an array in query-order */
const mapJustificationRows = (rows, prefix = '') => {
  const [justificationsById, orderedJustificationIds] = mapJustificationRowsWithOrdering(rows, prefix)
  const orderedJustifications = []
  forEach(orderedJustificationIds, justificationId => {
    orderedJustifications.push(justificationsById[justificationId])
  })
  return orderedJustifications
}

const mapJustificationRowsWithOrdering = (rows, prefix = '') => {
  // Keep track of the order so that we can efficiently put them back in order
  const orderedJustificationIds = []
  const justificationRowsById = {}
  // Keep track of whether we've seen the row before since there may be duplicates after joining with statement compound atoms
  const justificationIds = {}
  const writQuotesRowsById = {}
  const statementCompoundRowsById = {}
  const statementCompoundAtomsByStatementCompoundId = {}

  forEach(rows, row => {
    const rowId = row[prefix + 'justification_id']
    orderedJustificationIds.push(rowId)

    if (!has(justificationIds, rowId)) {
      justificationRowsById[rowId] = {
        justification_id:          rowId,
        root_statement_id:         row[prefix + 'root_statement_id'],
        root_polarity:             row[prefix + 'root_polarity'],
        root_statement_text:       row[prefix + 'root_statement_text'],
        root_statement_created:    row[prefix + 'root_statement_created'],
        root_statement_creator_id: row[prefix + 'root_statement_creator_id'],
        target_type:               row[prefix + 'target_type'],
        target_id:                 row[prefix + 'target_id'],
        basis_type:                row[prefix + 'basis_type'],
        basis_id:                  row[prefix + 'basis_id'],
        polarity:                  row[prefix + 'polarity'],
        creator_user_id:           row[prefix + 'creator_user_id'],
        created:                   row[prefix + 'created'],
      }
    }

    if (row[prefix + 'basis_writ_quote_id']) {
      writQuotesRowsById[row[prefix + 'basis_writ_quote_id']] = toWritQuote({
        writ_quote_id:        row[prefix + 'basis_writ_quote_id'],
        quote_text:           row[prefix + 'basis_writ_quote_quote_text'],
        created:              row[prefix + 'basis_writ_quote_created'],
        creator_user_id:      row[prefix + 'basis_writ_quote_creator_user_id'],
        writ_id:              row[prefix + 'basis_writ_quote_writ_id'],
        writ_text:            row[prefix + 'basis_writ_quote_writ_text'],
        writ_created:         row[prefix + 'basis_writ_quote_writ_created'],
        writ_creator_user_id: row[prefix + 'basis_writ_quote_creator_user_id'],
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
          statement_compound_id:     row[prefix + 'basis_statement_compound_id'],
          statement_id:              row[prefix + 'basis_statement_compound_atom_statement_id'],
          statement_text:            row[prefix + 'basis_statement_compound_atom_statement_text'],
          statement_created:         row[prefix + 'basis_statement_compound_atom_statement_created'],
          statement_creator_user_id: row[prefix + 'basis_statement_compound_atom_statement_creator_user_id'],
          order_position:            row[prefix + 'basis_statement_compound_atom_order_position'],
        })
        atomsByStatementId[atom.statement.id] = atom
      }
    }
  })

  const statementCompoundsById = mapValues(statementCompoundRowsById, (row, id) =>
    toStatementCompound(row, statementCompoundAtomsByStatementCompoundId[id])
  )

  const justificationsById = mapValues(justificationRowsById, row => toJustification(row, null, statementCompoundsById, writQuotesRowsById))
  return [justificationsById, orderedJustificationIds]
}

/** Creates a few things for making an ordered and limited query an number of justifications.  Good for pagination.
 * Because the query needs to join in bases to support filtering, it will include not only the justifications, but also
 * any basis columns that can be joined in while preserving a one-to-one (because otherwise we would have multiple rows
 * per justification, screwing up the LIMIT clause.)
 *
 * @param sorts {property, direction}  | {p, d} - an array of instructions for sorting the justifications
 * @param count integer - the maximum number of justifications to return
 * @param filters object - key values of values upon which to filter.
 * @param initialArgs Array<any> - args the caller wants to appear in the returned args. In hindsight, the caller could just add these, so we should refactor so that this is not a parameter
 * @param isContinuation boolean - whether the query is a continuation of a pagination query
 */
const makeReadLimitedJustificationsQueryParts = (logger, sorts, count, filters, initialArgs, isContinuation = false) => {
  const args = clone(initialArgs)
  let countSql = ''
  if (isFinite(count)) {
    args.push(count)
    countSql = `\nlimit $${args.length}`
  }

  const whereSqls = [
    'j.deleted is null',
    'wq.deleted is null',
    'w.deleted is null',
    'sc.deleted is null',
  ]
  const continuationWhereSqls = []
  const prevWhereSqls = []
  const orderBySqls = []
  const extraWithClauses = []
  const extraJoinClauses = []
  forEach(sorts, sort => {

    // The default direction is ascending, so if it is missing that's ok
    const direction = sort.direction === SortDirection.DESCENDING ?
      DatabaseSortDirection.DESCENDING :
      DatabaseSortDirection.ASCENDING

    const sortProperty = sort.property
    // 'id' is a special property name for entities. The column is prefixed by the entity type
    const columnName = sortProperty === 'id' ? 'justification_id' : snakeCase(sortProperty)

    whereSqls.push(`j.${columnName} is not null`)
    orderBySqls.push(`j.${columnName} ${direction}`)

    if (isContinuation) {
      let operator = direction === DatabaseSortDirection.ASCENDING ? '>' : '<'
      const value = sort.value
      args.push(value)
      const currContinuationWhereSql = concat(prevWhereSqls, [`j.${columnName} ${operator} $${args.length}`])
      continuationWhereSqls.push(currContinuationWhereSql.join(' and '))
      prevWhereSqls.push(`j.${columnName} = $${args.length}`)
    }
  })

  forEach(filters, (filterValue, filterName) => {
    // Note, some filters are incompatible, such as statementId or statementCompoundId and writQuoteId.
    // statementId and statementCompoundId may be incompatible if the statementId doesn't appear in any compound having
    // the statementCompoundId
    if (!filterValue) {
      logger.warn(`skipping filter ${filterName} because it has no value`)
      return
    }
    switch (filterName) {
      case 'statementId': {
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
        extraWithClauses.push(statementLimitedJustificationIdsSql)
        extraJoinClauses.push(`join statement_limited_justification_ids using (justification_id)`)
        break
      }
      case 'statementCompoundId': {
        args.push(filterValue)
        whereSqls.push(`sc.statement_compound_id = $${args.length}`)
        break
      }
      case 'writQuoteId': {
        args.push(filterValue)
        whereSqls.push(`wq.writ_quote_id = $${args.length}`)
        break
      }
      case 'writId': {
        args.push(filterValue)
        whereSqls.push(`w.writ_id = $${args.length}`)
        break
      }
      default:
        throw newImpossibleError(`Unsupported justification filter: ${filterName}`)
    }
  })

  const continuationWhereSql = continuationWhereSqls.length > 0 ?
    `and (
          ${continuationWhereSqls.join('\n or ')}
         )` :
    ''
  const whereSql = whereSqls.join('\nand ')
  const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

  const limitedJustificationsSql = `
      select distinct
          j.*
        , s.text                   as root_statement_text
        , s.created                as root_statement_created
        , s.creator_user_id        as root_statement_creator_id
        , wq.writ_quote_id         as basis_writ_quote_id
        , wq.quote_text            as basis_writ_quote_quote_text
        , wq.created               as basis_writ_quote_created
        , wq.creator_user_id       as basis_writ_quote_creator_user_id
        , w.writ_id                as basis_writ_quote_writ_id
        , w.title                  as basis_writ_quote_writ_title
        , w.created                as basis_writ_quote_writ_created
        , w.creator_user_id        as basis_writ_quote_writ_creator_user_id
        , sc.statement_compound_id as basis_statement_compound_id
      from justifications j
          ${join(extraJoinClauses, '\n')}
          join statements s on j.root_statement_id = s.statement_id
          left join writ_quotes wq on 
                j.basis_id = wq.writ_quote_id 
            and j.basis_type = $1
          left join writs w on wq.writ_id = w.writ_id
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
    /** The arguments to the  */
    args,
    limitedJustificationsSql,
    extraWithClauses,
    orderBySql,
  }
}

const getNewJustificationRootPolarity = (justification, logger, database) => Promise.resolve()
  .then(() => {
    switch (justification.target.type) {
      case JustificationTargetType.STATEMENT:
        // root justifications have root polarity equal to their polarity
        return justification.polarity
      case JustificationTargetType.JUSTIFICATION:
        return getTargetRootPolarity(logger, database, justification)
          .then(rootPolarity => {
            assert(justification.polarity === JustificationPolarity.NEGATIVE, "Justifications targeting justifications must be negative")
            return negateRootPolarity(rootPolarity)
          })
      default:
        throw newImpossibleError(`Cannot create justification because had unsupported target type: ${justification.target.type}`)
    }
  })

const getTargetRootPolarity = (logger, database, justification) =>
  database.query('select root_polarity from justifications where justification_id = $1', [justification.target.entity.id])
    .then( ({rows}) => {
      if (rows.length < 1) {
        throw new EntityNotFoundError(`Could not create justification because target justification having ID ${justification.target.id} did not exist`)
      } else if (rows.length > 1) {
        logger.error(`while creating justification, found more than one target justification having ID ${justification.target.id}`)
      }

      const {root_polarity} = head(rows)
      return root_polarity
    })

exports.JustificationsDao = class JustificationsDao {

  constructor(logger, database, statementCompoundsDao, writQuotesDao) {
    this.logger = logger
    this.database = database
    this.statementCompoundsDao = statementCompoundsDao
    this.writQuotesDao = writQuotesDao
  }

  readJustifications(sorts, count, filters, isContinuation = false) {
    const {
      args: justificationsArgs,
      limitedJustificationsSql: justificationsLimitedJustificationsSql,
      extraWithClauses: justificationsExtraWithClauses,
      orderBySql: justificationsOrderBySql,
    } = makeReadLimitedJustificationsQueryParts(this.logger, sorts, count, filters, [
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.STATEMENT_COMPOUND,
    ], isContinuation)
    const justificationsExtraWithClausesSql = justificationsExtraWithClauses.length > 0 ?
      join(map(justificationsExtraWithClauses, c => c + ',\n')) :
      ''
    const justificationsSql = `
      with
        ${justificationsExtraWithClausesSql}
        limited_justifications as (
          ${justificationsLimitedJustificationsSql}
        )
      select 
          j.*
        , sca.order_position    as basis_statement_compound_atom_order_position
        , scas.statement_id     as basis_statement_compound_atom_statement_id
        , scas.text             as basis_statement_compound_atom_statement_text
        , scas.created          as basis_statement_compound_atom_statement_created
        , scas.creator_user_id  as basis_statement_compound_atom_statement_creator_user_id
      from limited_justifications j
          left join statement_compound_atoms sca on j.basis_statement_compound_id = sca.statement_compound_id
          left join statements scas on sca.statement_id = scas.statement_id
        where scas.deleted is null
      ${justificationsOrderBySql}
      `

    const {
      args: targetJustificationsArgs,
      limitedJustificationsSql: targetJustificationsLimitedJustificationsSql,
      extraWithClauses: targetJustificationsExtraWithClauses,
      orderBySql: targetJustificationsOrderBySql,
    } = makeReadLimitedJustificationsQueryParts(this.logger, sorts, count, filters, [
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.STATEMENT_COMPOUND,
      JustificationTargetType.JUSTIFICATION,
    ], isContinuation)
    const targetJustificationsAdditionalWithClausesSql = targetJustificationsExtraWithClauses.length > 0 ?
      join(map(targetJustificationsExtraWithClauses, c => c + ',\n')) :
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
                 
        , tj.justification_id       as tj_justification_id
        , tj.root_statement_id      as tj_root_statement_id
        , tj.root_polarity          as tj_root_polarity
        , tj.target_type            as tj_target_type
        , tj.target_id              as tj_target_id
        , tj.basis_type             as tj_basis_type
        , tj.basis_id               as tj_basis_id
        , tj.polarity               as tj_polarity
        , tj.creator_user_id        as tj_creator_user_id
        , tj.created                as tj_created
        
        , wq.writ_quote_id          as tj_basis_writ_quote_id
        , wq.quote_text             as tj_basis_writ_quote_quote_text
        , wq.created                as tj_basis_writ_quote_created
        , wq.creator_user_id        as tj_basis_writ_quote_creator_user_id
        , w.writ_id                 as tj_basis_writ_quote_writ_id
        , w.title                   as tj_basis_writ_quote_writ_title
        , w.created                 as tj_basis_writ_quote_writ_created
        , w.creator_user_id         as tj_basis_writ_quote_writ_creator_user_id
        
        , sc.statement_compound_id  as tj_basis_statement_compound_id
        , sca.order_position        as tj_basis_statement_compound_atom_order_position
        , scas.statement_id         as tj_basis_statement_compound_atom_statement_id
        , scas.text                 as tj_basis_statement_compound_atom_statement_text
        , scas.created              as tj_basis_statement_compound_atom_statement_created
        , scas.creator_user_id      as tj_basis_statement_compound_atom_statement_creator_user_id
      from limited_justifications j
          join justifications tj on 
                j.target_id = tj.justification_id 
            and j.target_type = $3
          left join writ_quotes wq on 
                tj.basis_id = wq.writ_quote_id 
            and tj.basis_type = $1
          left join writs w on wq.writ_id = w.writ_id
          left join statement_compounds sc on tj.basis_id = sc.statement_compound_id and tj.basis_type = $2
          left join statement_compound_atoms sca on sc.statement_compound_id = sca.statement_compound_id
          left join statements scas on sca.statement_id = scas.statement_id
        where scas.deleted is null
      ${targetJustificationsOrderBySql}
      `
    return Promise.all([
      this.database.query(justificationsSql, justificationsArgs),
      this.database.query(targetJustificationsSql, targetJustificationsArgs),
    ])
      .then( ([{rows: justificationRows}, {rows: targetJustificationRows}]) => {
        const justifications = mapJustificationRows(justificationRows)
        const targetJustificationsById = mapJustificationRowsById(targetJustificationRows, 'tj_')
        forEach(justifications, justification => {
          if (justification.target.type !== JustificationTargetType.JUSTIFICATION) {
            return
          }
          const target = targetJustificationsById[justification.target.entity.id]
          if (!target) {
            this.logger.warning(`Justification ${justification.id} is missing it's target justification ${justification.target.entity.id}`)
          }
          // TODO ensure that if a justification is in both justifications and targetJustifications that we use the same object in both places?
          justification.target.entity = target
        })

        return justifications
      })
  }

  readJustificationsWithBasesAndVotesByRootStatementId(authToken, rootStatementId) {
    const sql = `
      select 
          j.*
        , v.vote_id
        , v.polarity    as vote_polarity
        , v.target_type as vote_target_type
        , v.target_id   as vote_target_id
      from justifications j 
        left join statement_compounds sc on 
              j.basis_type = $5 
          and j.basis_id = sc.statement_compound_id 
        left join writ_quotes wq on 
              j.basis_type = $4 
          and j.basis_id = wq.writ_quote_id
        left join user_auth_tokens auth on auth.auth_token = $2
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
      this.database.query(sql, [rootStatementId, authToken, VoteTargetType.JUSTIFICATION, JustificationBasisType.WRIT_QUOTE, JustificationBasisType.STATEMENT_COMPOUND]),
      this.statementCompoundsDao.readStatementCompoundsByIdForRootStatementId(rootStatementId),
      this.writQuotesDao.readWritQuotesByIdForRootStatementId(rootStatementId),
    ])
      .then( ([
        {rows: justification_rows},
        statementCompoundsById,
        writQuotesById
      ]) => {
        const {rootJustifications, counterJustificationsByJustificationId} =
          groupRootJustifications(rootStatementId, justification_rows)
        return map(rootJustifications, j =>
          toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, writQuotesById))
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
    return this.database.query(sql, [statementId, JustificationBasisType.STATEMENT_COMPOUND])
      .then( ({rows}) => map(rows, toJustification))
  }

  readJustificationById(justificationId) {
    return this.database.query('select * from justifications where justification_id = $1 and deleted is null', [justificationId])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one justification has ID ${justificationId}`)
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
    return this.database.query(sql, args)
      .then( ({rows}) => toJustification(head(rows)) )
      .then(equivalentJustification => {
        if (equivalentJustification && toString(equivalentJustification.rootStatement.id) !== toString(justification.rootStatement.id)) {
          this.logger.error(`justification's rootStatement ID ${justification.rootStatement.id} !== equivalent justification ${equivalentJustification.id}'s rootStatement ID ${equivalentJustification.rootStatement.id}`)
        }
        return equivalentJustification
      })
  }

  createJustification(justification, userId, now) {

    return getNewJustificationRootPolarity(justification, this.logger, this.database)
      .then((rootPolarity) => {

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

        return this.database.query(sql, args).then( ({rows: [row]}) => toJustification(row))
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
    return this.database.query('update justifications set deleted = $2 where justification_id = $1 returning justification_id', [justificationId, now])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one (${rows.length}) justifications deleted for ID ${justificationId}`)
        }
        const row = head(rows)
        if (!row) {
          return null
        }
        return row.justification_id
      })
  }

  deleteCounterJustificationsToJustificationIds(justificationIds, now) {
    return this.database.query(`
        update justifications set deleted = $1 
        where 
              target_type = $2
          and target_id = any ($3) 
        returning justification_id`,
      [now, JustificationTargetType.JUSTIFICATION, justificationIds]
    ).then( ({rows}) => map(rows, row => row.justification_id))
  }
}
