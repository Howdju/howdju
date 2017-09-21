const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const has = require('lodash/has')
const head = require('lodash/head')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const Promise = require('bluebird')
const snakeCase = require('lodash/snakeCase')

const {
  JustificationTargetType,
  JustificationBasisType,
  JustificationPolarity,
  VoteTargetType,
  SortDirection,
  negateRootPolarity,
  newImpossibleError,
  assert,
  pushAll,
  newExhaustedEnumError,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
  requireArgs,
  idEqual,
  isDefined,
} = require('howdju-common')

const {
  toJustification,
  toStatementCompound,
  toStatementCompoundAtom,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toWritQuote,
  toStatement,
} = require('./orm')
const {EntityNotFoundError} = require('../serviceErrors')
const {
  groupRootJustifications,
  renumberSqlArgs,
} = require('./util')
const {DatabaseSortDirection} = require('./daoModels')


exports.JustificationsDao = class JustificationsDao {

  constructor(logger, database, statementCompoundsDao, writQuotesDao, justificationBasisCompoundsDao) {
    requireArgs({logger, database, statementCompoundsDao, writQuotesDao, justificationBasisCompoundsDao})
    this.logger = logger
    this.database = database
    this.statementCompoundsDao = statementCompoundsDao
    this.writQuotesDao = writQuotesDao
    this.justificationBasisCompoundsDao = justificationBasisCompoundsDao
  }

  readJustifications(filters, sorts, count, isContinuation = false) {
    const {
      sql: limitedJustificationsSql,
      args: limitedJustificationsArgs,
    } = makeLimitedJustificationsClause(this.logger, filters, sorts, count, isContinuation)

    const tableAlias = 'j'
    const orderByExpressionsSql = makeJustificationsQueryOrderByExpressionsSql(sorts, tableAlias)
    const orderBySql = orderByExpressionsSql ? 'order by ' + orderByExpressionsSql : ''

    const justificationsSelectArgs = [
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.STATEMENT_COMPOUND,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.STATEMENT,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptType.WRIT_QUOTE,
    ]
    const justificationsRenumberedLimitedJustificationsSql = renumberSqlArgs(limitedJustificationsSql, justificationsSelectArgs.length)
    const justificationsArgs = concat(justificationsSelectArgs, limitedJustificationsArgs)
    const justificationsSql = `
      with
        limited_justifications as (
          ${justificationsRenumberedLimitedJustificationsSql}
        )
      select 
          ${tableAlias}.justification_id
        , ${tableAlias}.root_statement_id
        , ${tableAlias}.root_polarity
        , ${tableAlias}.target_type
        , ${tableAlias}.target_id
        , ${tableAlias}.basis_type
        , ${tableAlias}.basis_id
        , ${tableAlias}.polarity
        , ${tableAlias}.creator_user_id
        , ${tableAlias}.created
        
        , rs.statement_id         as root_statement_id
        , rs.text                 as root_statement_text
        , rs.created              as root_statement_created
        , rs.creator_user_id      as root_statement_creator_user_id
        
        , wq.writ_quote_id          as basis_writ_quote_id
        , wq.quote_text             as basis_writ_quote_quote_text
        , wq.created                as basis_writ_quote_created
        , wq.creator_user_id        as basis_writ_quote_creator_user_id
        , w.writ_id                 as basis_writ_quote_writ_id
        , w.title                   as basis_writ_quote_writ_title
        , w.created                 as basis_writ_quote_writ_created
        , w.creator_user_id         as basis_writ_quote_writ_creator_user_id
        
        , sc.statement_compound_id  as basis_statement_compound_id
        , sca.order_position        as basis_statement_compound_atom_order_position
        , scas.statement_id         as basis_statement_compound_atom_statement_id
        , scas.text                 as basis_statement_compound_atom_statement_text
        , scas.created              as basis_statement_compound_atom_statement_created
        , scas.creator_user_id      as basis_statement_compound_atom_statement_creator_user_id
        
        , jbc.justification_basis_compound_id          as basis_jbc_id
        , jbca.justification_basis_compound_atom_id    as basis_jbc_atom_id
        , jbca.entity_type                             as basis_jbc_atom_entity_type
        , jbca.order_position                          as basis_jbc_atom_order_position
        
        , jbcas.statement_id                           as basis_jbc_atom_statement_id
        , jbcas.text                                   as basis_jbc_atom_statement_text
        , jbcas.created                                as basis_jbc_atom_statement_created
        , jbcas.creator_user_id                        as basis_jbc_atom_statement_creator_user_id
        
        , sep.source_excerpt_paraphrase_id             as basis_jbc_atom_sep_id
        , sep_s.statement_id                           as basis_jbc_atom_sep_paraphrasing_statement_id
        , sep_s.text                                   as basis_jbc_atom_sep_paraphrasing_statement_text
        , sep_s.created                                as basis_jbc_atom_sep_paraphrasing_statement_created
        , sep_s.creator_user_id                        as basis_jbc_atom_sep_paraphrasing_statement_creator_user_id
        , sep.source_excerpt_type                      as basis_jbc_atom_sep_source_excerpt_type
        , sep_wq.writ_quote_id                         as basis_jbc_atom_sep_writ_quote_id
        , sep_wq.quote_text                            as basis_jbc_atom_sep_writ_quote_quote_text
        , sep_wq.created                               as basis_jbc_atom_sep_writ_quote_created
        , sep_wq.creator_user_id                       as basis_jbc_atom_sep_writ_quote_creator_user_id
        , sep_wqw.writ_id                              as basis_jbc_atom_sep_writ_quote_writ_id
        , sep_wqw.title                                as basis_jbc_atom_sep_writ_quote_writ_title
        , sep_wqw.created                              as basis_jbc_atom_sep_writ_quote_writ_created
        , sep_wqw.creator_user_id                      as basis_jbc_atom_sep_writ_quote_writ_creator_user_id
      from limited_justifications
          join justifications ${tableAlias} using (justification_id)
          
          join statements rs on ${tableAlias}.root_statement_id = rs.statement_id
          
          left join writ_quotes wq on 
                ${tableAlias}.basis_type = $1
            and ${tableAlias}.basis_id = wq.writ_quote_id 
          left join writs w using (writ_id)
          
          left join statement_compounds sc on 
                ${tableAlias}.basis_type = $2
            and ${tableAlias}.basis_id = sc.statement_compound_id
          left join statement_compound_atoms sca using (statement_compound_id)
          left join statements scas on sca.statement_id = scas.statement_id
          
          left join justification_basis_compounds jbc on
                ${tableAlias}.basis_type = $3
            and ${tableAlias}.basis_id = jbc.justification_basis_compound_id
          left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          left join statements jbcas on
                jbca.entity_type = $4
            and jbca.entity_id = jbcas.statement_id
          left join source_excerpt_paraphrases sep on
                jbca.entity_type = $5
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
          left join statements sep_s on
                sep.paraphrasing_statement_id = sep_s.statement_id
          left join writ_quotes sep_wq on
                sep.source_excerpt_type = $6
            and sep.source_excerpt_id = sep_wq.writ_quote_id
          left join writs sep_wqw on
                sep_wq.writ_id = sep_wqw.writ_id
        where
              ${tableAlias}.deleted is null
          and rs.deleted is null
          and wq.deleted is null
          and w.deleted is null
          and sc.deleted is null 
          and scas.deleted is null
          and jbc.deleted is null
          and jbcas.deleted is null
          and sep.deleted is null
          and sep_s.deleted is null
          and sep_wq.deleted is null
          and sep_wqw.deleted is null
      ${orderBySql}
    `

    const targetJustificationsSelectArgs = [
      JustificationTargetType.JUSTIFICATION,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.STATEMENT_COMPOUND,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.STATEMENT,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptType.WRIT_QUOTE,
    ]
    const targetJustificationsRenumberedLimitedJustificationsSql = renumberSqlArgs(limitedJustificationsSql, targetJustificationsSelectArgs.length)
    const targetJustificationsArgs = concat(targetJustificationsSelectArgs, limitedJustificationsArgs)
    const targetJustificationPrefix = 'tj_'
    const targetJustificationsSql = `
      with
        limited_justifications as (
          ${targetJustificationsRenumberedLimitedJustificationsSql}
        )
      select 
         -- We don't use this, but just for completeness
          ${tableAlias}.justification_id
                 
        , tj.justification_id       as ${targetJustificationPrefix}justification_id
        , tj.root_statement_id      as ${targetJustificationPrefix}root_statement_id
        , tj.root_polarity          as ${targetJustificationPrefix}root_polarity
        , tj.target_type            as ${targetJustificationPrefix}target_type
        , tj.target_id              as ${targetJustificationPrefix}target_id
        , tj.basis_type             as ${targetJustificationPrefix}basis_type
        , tj.basis_id               as ${targetJustificationPrefix}basis_id
        , tj.polarity               as ${targetJustificationPrefix}polarity
        , tj.creator_user_id        as ${targetJustificationPrefix}creator_user_id
        , tj.created                as ${targetJustificationPrefix}created
        
        , rs.statement_id         as ${targetJustificationPrefix}root_statement_id
        , rs.text                 as ${targetJustificationPrefix}root_statement_text
        , rs.created              as ${targetJustificationPrefix}root_statement_created
        , rs.creator_user_id      as ${targetJustificationPrefix}root_statement_creator_user_id
        
        , wq.writ_quote_id          as ${targetJustificationPrefix}basis_writ_quote_id
        , wq.quote_text             as ${targetJustificationPrefix}basis_writ_quote_quote_text
        , wq.created                as ${targetJustificationPrefix}basis_writ_quote_created
        , wq.creator_user_id        as ${targetJustificationPrefix}basis_writ_quote_creator_user_id
        , w.writ_id                 as ${targetJustificationPrefix}basis_writ_quote_writ_id
        , w.title                   as ${targetJustificationPrefix}basis_writ_quote_writ_title
        , w.created                 as ${targetJustificationPrefix}basis_writ_quote_writ_created
        , w.creator_user_id         as ${targetJustificationPrefix}basis_writ_quote_writ_creator_user_id
        
        , sc.statement_compound_id  as ${targetJustificationPrefix}basis_statement_compound_id
        , sca.order_position        as ${targetJustificationPrefix}basis_statement_compound_atom_order_position
        , scas.statement_id         as ${targetJustificationPrefix}basis_statement_compound_atom_statement_id
        , scas.text                 as ${targetJustificationPrefix}basis_statement_compound_atom_statement_text
        , scas.created              as ${targetJustificationPrefix}basis_statement_compound_atom_statement_created
        , scas.creator_user_id      as ${targetJustificationPrefix}basis_statement_compound_atom_statement_creator_user_id
        
        , jbc.justification_basis_compound_id        as ${targetJustificationPrefix}basis_jbc_id
        , jbca.justification_basis_compound_atom_id  as ${targetJustificationPrefix}basis_jbc_atom_id
        , jbca.entity_type                           as ${targetJustificationPrefix}basis_jbc_atom_entity_type
        , jbca.order_position                        as ${targetJustificationPrefix}basis_jbc_atom_order_position
        
        , jbcas.statement_id                         as ${targetJustificationPrefix}basis_jbc_atom_statement_id
        , jbcas.text                                 as ${targetJustificationPrefix}basis_jbc_atom_statement_text
        , jbcas.created                              as ${targetJustificationPrefix}basis_jbc_atom_statement_created
        , jbcas.creator_user_id                      as ${targetJustificationPrefix}basis_jbc_atom_statement_creator_user_id
        
        , sep.source_excerpt_paraphrase_id           as ${targetJustificationPrefix}basis_jbc_atom_sep_id
        , sep_s.statement_id                         as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_statement_id
        , sep_s.text                                 as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_statement_text
        , sep_s.created                              as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_statement_created
        , sep_s.creator_user_id                      as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_statement_creator_user_id
        , sep.source_excerpt_type                    as ${targetJustificationPrefix}basis_jbc_atom_sep_source_excerpt_type
        , sep_wq.writ_quote_id                       as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_id
        , sep_wq.quote_text                          as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_quote_text
        , sep_wq.created                             as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_created
        , sep_wq.creator_user_id                     as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_creator_user_id
        , sep_wqw.writ_id                            as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_id
        , sep_wqw.title                              as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_title
        , sep_wqw.created                            as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_created
        , sep_wqw.creator_user_id                    as ${targetJustificationPrefix}basis_jbc_atom_sep_writ_quote_writ_creator_user_id
      from limited_justifications lj
          join justifications ${tableAlias} using (justification_id)
         
          join statements rs on ${tableAlias}.root_statement_id = rs.statement_id
          
          join justifications tj on 
                ${tableAlias}.target_type = $1
            and ${tableAlias}.target_id = tj.justification_id 
          
          left join writ_quotes wq on 
                tj.basis_type = $2
            and tj.basis_id = wq.writ_quote_id 
          left join writs w on wq.writ_id = w.writ_id
          
          left join statement_compounds sc on 
                tj.basis_type = $3
            and tj.basis_id = sc.statement_compound_id
          left join statement_compound_atoms sca using (statement_compound_id)
          left join statements scas on sca.statement_id = scas.statement_id
          
          left join justification_basis_compounds jbc on
                tj.basis_type = $4
            and tj.basis_id = jbc.justification_basis_compound_id
          left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          left join statements jbcas on
                jbca.entity_type = $5
            and jbca.entity_id = jbcas.statement_id
          left join source_excerpt_paraphrases sep on
                jbca.entity_type = $6
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
          left join statements sep_s on
                sep.paraphrasing_statement_id = sep_s.statement_id
          left join writ_quotes sep_wq on
                sep.source_excerpt_type = $7
            and sep.source_excerpt_id = sep_wq.writ_quote_id
          left join writs sep_wqw on
                sep_wq.writ_id = sep_wqw.writ_id
        where
              ${tableAlias}.deleted is null
          and rs.deleted is null
          and tj.deleted is null
          and wq.deleted is null
          and w.deleted is null
          and sc.deleted is null 
          and scas.deleted is null
          and jbc.deleted is null
          and jbcas.deleted is null
          and sep.deleted is null
          and sep_s.deleted is null
          and sep_wq.deleted is null
          and sep_wqw.deleted is null
      -- no need to order because they are joined to the ordered targeting justifications
      `

    const targetStatementsSelectArgs = [
      JustificationTargetType.STATEMENT,
    ]
    const targetStatementsRenumberedLimitedJustificationsSql = renumberSqlArgs(limitedJustificationsSql, targetStatementsSelectArgs.length)
    const targetStatementsArgs = concat(targetStatementsSelectArgs, limitedJustificationsArgs)
    const targetStatementsSql = `
      with
        limited_justifications as (
          ${targetStatementsRenumberedLimitedJustificationsSql}
        )
      select 
          ts.statement_id
        , ts.text
        , ts.created
        , ts.creator_user_id
      from limited_justifications lj
          join justifications j using (justification_id)
          join statements ts on 
                j.target_type = $1
            and j.target_id = ts.statement_id
        where
              j.deleted is null
          and ts.deleted is null
      -- no need to order because they are joined to the ordered targeting justifications
    `
    return Promise.all([
      this.database.query(justificationsSql, justificationsArgs),
      this.database.query(targetJustificationsSql, targetJustificationsArgs),
      this.database.query(targetStatementsSql, targetStatementsArgs),
    ])
      .then( ([
        {rows: justificationRows},
        {rows: targetJustificationRows},
        {rows: targetStatementRows},
      ]) => {
        const justifications = mapJustificationRows(justificationRows)
        const targetJustificationsById = mapJustificationRowsById(targetJustificationRows, targetJustificationPrefix)
        const targetStatementsById = mapStatementRowsById(targetStatementRows)

        forEach(justifications, justification => {
          let target
          switch (justification.target.type) {
            case JustificationTargetType.JUSTIFICATION:
              target = targetJustificationsById[justification.target.entity.id]
              break
            case JustificationTargetType.STATEMENT:
              target = targetStatementsById[justification.target.entity.id]
              break
            default:
              throw newExhaustedEnumError('JustificationTargetType', justification.target.type)
          }
          if (!target) {
            this.logger.error(`Justification ${justification.id} is missing it's target justification ${justification.target.entity.id}`)
          }

          justification.target.entity = target
        })

        return justifications
      })
  }

  readJustificationsWithBasesAndVotesByRootStatementId(rootStatementId, {userId}) {
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
        left join votes v on 
              v.target_type = $3
          and j.justification_id = v.target_id
          and v.user_id = $2
          and v.deleted IS NULL
        where 
              j.deleted is null
          and j.root_statement_id = $1
      `
    return Promise.all([
      this.database.query(sql, [rootStatementId, userId, VoteTargetType.JUSTIFICATION, JustificationBasisType.WRIT_QUOTE, JustificationBasisType.STATEMENT_COMPOUND]),
      this.statementCompoundsDao.readStatementCompoundsByIdForRootStatementId(rootStatementId),
      this.writQuotesDao.readWritQuotesByIdForRootStatementId(rootStatementId),
      this.justificationBasisCompoundsDao.readJustificationBasisCompoundsByIdForRootStatementId(rootStatementId),
    ])
      .then( ([
        {rows: justification_rows},
        statementCompoundsById,
        writQuotesById,
        justificationBasisCompoundsById
      ]) => {
        const {rootJustifications, counterJustificationsByJustificationId} =
          groupRootJustifications(rootStatementId, justification_rows)
        return map(rootJustifications, j =>
          toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, writQuotesById, justificationBasisCompoundsById))
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
        if (equivalentJustification && !idEqual(equivalentJustification.rootStatement.id, justification.rootStatement.id)) {
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

/** Directly return an object of the justifications keyed by their ID */
function mapJustificationRowsById(rows, prefix = '') {
  const [justificationsById] = mapJustificationRowsWithOrdering(rows, prefix)
  return justificationsById
}

function mapStatementRowsById(rows) {
  const byId = {}
  forEach(rows, row => {
    const statement = toStatement(row)
    byId[statement.id] = statement
  })
  return byId
}

/** Use the ordering to return the justifications as an array in query-order */
function mapJustificationRows(rows, prefix = '') {
  const [justificationsById, orderedJustificationIds] = mapJustificationRowsWithOrdering(rows, prefix)
  const orderedJustifications = []
  forEach(orderedJustificationIds, justificationId => {
    orderedJustifications.push(justificationsById[justificationId])
  })
  return orderedJustifications
}

function mapJustificationRowsWithOrdering(rows, prefix = '') {
  // Keep track of the order so that we can efficiently put them back in order
  const orderedJustificationIds = []
  const justificationRowsById = {}
  const writQuotesRowsById = {}
  const statementCompoundRowsById = {}
  const statementCompoundAtomsByCompoundId = {}
  const justificationBasisCompoundRowsById = {}
  const justificationBasisCompoundAtomsByCompoundId = {}

  forEach(rows, row => {
    const rowId = row[prefix + 'justification_id']

    if (!has(justificationRowsById, rowId)) {
      orderedJustificationIds.push(rowId)
      justificationRowsById[rowId] = {
        justification_id:          rowId,
        root_polarity:             row[prefix + 'root_polarity'],
        root_statement_id:         row[prefix + 'root_statement_id'],
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

    const basisWritQuoteId = row[prefix + 'basis_writ_quote_id']
    if (basisWritQuoteId) {
      writQuotesRowsById[basisWritQuoteId] = toWritQuote({
        writ_quote_id:        basisWritQuoteId,
        quote_text:           row[prefix + 'basis_writ_quote_quote_text'],
        created:              row[prefix + 'basis_writ_quote_created'],
        creator_user_id:      row[prefix + 'basis_writ_quote_creator_user_id'],
        writ_id:              row[prefix + 'basis_writ_quote_writ_id'],
        writ_title:           row[prefix + 'basis_writ_quote_writ_title'],
        writ_created:         row[prefix + 'basis_writ_quote_writ_created'],
        writ_creator_user_id: row[prefix + 'basis_writ_quote_creator_user_id'],
      })
    }

    const statementCompoundId = row[prefix + 'basis_statement_compound_id']
    if (isDefined(statementCompoundId)) {
      const statementCompoundRow = statementCompoundRowsById[statementCompoundId]
      if (!statementCompoundRow) {
        statementCompoundRowsById[statementCompoundId] = {
          statement_compound_id: statementCompoundId
        }
      }

      // Atoms are stored by statement ID because statement compound atoms don't have their own ID
      let atomsByStatementId = statementCompoundAtomsByCompoundId[statementCompoundId]
      if (!atomsByStatementId) {
        statementCompoundAtomsByCompoundId[statementCompoundId] = atomsByStatementId = {}
      }
      if (!has(atomsByStatementId, row[prefix + 'basis_statement_compound_atom_statement_id'])) {
        const atom = toStatementCompoundAtom({
          statement_compound_id:     statementCompoundId,
          statement_id:              row[prefix + 'basis_statement_compound_atom_statement_id'],
          statement_text:            row[prefix + 'basis_statement_compound_atom_statement_text'],
          statement_created:         row[prefix + 'basis_statement_compound_atom_statement_created'],
          statement_creator_user_id: row[prefix + 'basis_statement_compound_atom_statement_creator_user_id'],
          order_position:            row[prefix + 'basis_statement_compound_atom_order_position'],
        })
        atomsByStatementId[atom.entity.id] = atom
      }
    }

    const justificationBasisCompoundId = row[prefix + 'basis_jbc_id']
    if (isDefined(justificationBasisCompoundId)) {
      const justificationBasisCompoundRow = justificationBasisCompoundRowsById[justificationBasisCompoundId]
      if (!justificationBasisCompoundRow) {
        justificationBasisCompoundRowsById[justificationBasisCompoundId] = {
          justification_basis_compound_id: justificationBasisCompoundId
        }
      }

      let atomsById = justificationBasisCompoundAtomsByCompoundId[justificationBasisCompoundId]
      if (!atomsById) {
        justificationBasisCompoundAtomsByCompoundId[justificationBasisCompoundId] = atomsById = {}
      }

      const atomId = row[prefix + 'basis_jbc_atom_id']
      if (!atomsById[atomId]) {
        const atomEntityType = row[prefix + 'basis_jbc_atom_entity_type']
        const atom = toJustificationBasisCompoundAtom({
          justification_basis_compound_atom_id: atomId,
          justification_basis_compound_id:      justificationBasisCompoundId,
          entity_type:                          atomEntityType,
          order_position:                       row[prefix + 'basis_jbc_atom_order_position'],

          statement_id:                row[prefix + 'basis_jbc_atom_statement_id'],
          statement_text:              row[prefix + 'basis_jbc_atom_statement_text'],
          statement_created:           row[prefix + 'basis_jbc_atom_statement_created'],
          statement_creator_user_id:   row[prefix + 'basis_jbc_atom_statement_creator_user_id'],
          source_excerpt_paraphrase_id:                          row[prefix + 'basis_jbc_atom_sep_id'],
          source_excerpt_paraphrasing_statement_id:              row[prefix + 'basis_jbc_atom_sep_paraphrasing_statement_id'],
          source_excerpt_paraphrasing_statement_text:            row[prefix + 'basis_jbc_atom_sep_paraphrasing_statement_text'],
          source_excerpt_paraphrasing_statement_created:         row[prefix + 'basis_jbc_atom_sep_paraphrasing_statement_created'],
          source_excerpt_paraphrasing_statement_creator_user_id: row[prefix + 'basis_jbc_atom_sep_paraphrasing_statement_creator_user_id'],
          source_excerpt_type:                            row[prefix + 'basis_jbc_atom_sep_source_excerpt_type'],
          source_excerpt_writ_quote_id:                   row[prefix + 'basis_jbc_atom_sep_writ_quote_id'],
          source_excerpt_writ_quote_quote_text:           row[prefix + 'basis_jbc_atom_sep_writ_quote_quote_text'],
          source_excerpt_writ_quote_created:              row[prefix + 'basis_jbc_atom_sep_writ_quote_created'],
          source_excerpt_writ_quote_creator_user_id:      row[prefix + 'basis_jbc_atom_sep_writ_quote_creator_user_id'],
          source_excerpt_writ_quote_writ_id:              row[prefix + 'basis_jbc_atom_sep_writ_quote_writ_id'],
          source_excerpt_writ_quote_writ_title:           row[prefix + 'basis_jbc_atom_sep_writ_quote_writ_title'],
          source_excerpt_writ_quote_writ_created:         row[prefix + 'basis_jbc_atom_sep_writ_quote_writ_created'],
          source_excerpt_writ_quote_writ_creator_user_id: row[prefix + 'basis_jbc_atom_sep_writ_quote_writ_creator_user_id'],
        })

        atomsById[atomId] = atom
      }
    }

    assert(basisWritQuoteId || statementCompoundId || justificationBasisCompoundId, "justification must have a basis")
  })

  const statementCompoundsById = mapValues(statementCompoundRowsById, (row, id) =>
    toStatementCompound(row, statementCompoundAtomsByCompoundId[id])
  )

  const justificationBasisCompoundsById = mapValues(justificationBasisCompoundRowsById, (row, id) =>
    toJustificationBasisCompound(row, justificationBasisCompoundAtomsByCompoundId[id])
  )

  const justificationsById = mapValues(justificationRowsById,
      row => toJustification(row, null, statementCompoundsById, writQuotesRowsById, justificationBasisCompoundsById))
  return [justificationsById, orderedJustificationIds]
}

function toSelect(columns, tableAlias) {
  const tablePrefix = tableAlias ? tableAlias + '.' : ''
  return map(columns, c => tablePrefix + c).join(', ')
}

function makeDefaultJustificationSql(justificationColumns) {
  const select = toSelect(justificationColumns, 'j')
  const sql = `select ${select} from justifications j where j.deleted is null`
  return {
    sql,
    args: [],
  }
}

function makeWritQuoteJustificationClause(writQuoteId, justificationColumns) {
  const justificationTableAlias = 'j'
  const select = toSelect(justificationColumns, justificationTableAlias)
  return [
    // writ-quote-based justifications
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join writ_quotes wq on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = wq.writ_quote_id
          where
                ${justificationTableAlias}.deleted is null 
            and wq.deleted is null
            and wq.writ_quote_id = $2 
      `,
      args: [
        JustificationBasisType.WRIT_QUOTE,
        writQuoteId,
      ],
    },
    // paraphrased writ-quotes
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms bca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  bca.entity_type = $2
              and bca.entity_id = sep.source_excerpt_id
            join writ_quotes wq on 
                  sep.source_excerpt_type = $3 
              and sep.source_excerpt_id = wq.writ_quote_id
          where
                ${justificationTableAlias}.deleted is null 
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and wq.writ_quote_id = $4
      `,
      args: [
        JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
        SourceExcerptType.WRIT_QUOTE,
        writQuoteId,
      ],
    },
  ]

}

function makeWritJustificationClause(writId, justificationColumns) {
  const justificationTableAlias = 'j'
  const select = toSelect(justificationColumns, justificationTableAlias)
  return [
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join writ_quotes wq on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = wq.writ_quote_id
            join writs w using (writ_id)
          where 
                ${justificationTableAlias}.deleted is null
            and wq.deleted is null
            and w.deleted is null
            and w.writ_id = $2 
      `,
      args: [
        JustificationBasisType.WRIT_QUOTE,
        writId,
      ]
    },
    // paraphrased writ-quote writs
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms bca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  bca.entity_type = $2
              and bca.entity_id = sep.source_excerpt_id
            join writ_quotes wq on 
                  sep.source_excerpt_type = $3 
              and sep.source_excerpt_id = wq.writ_quote_id
            join writs w using (writ_id)
          where
                ${justificationTableAlias}.deleted is null 
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and w.deleted is null
            and w.writ_id = $4
      `,
      args: [
        JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
        SourceExcerptType.WRIT_QUOTE,
        writId,
      ],
    },
  ]
}

function makeStatementCompoundJustificationClause(statementCompoundId, justificationColumns) {
  const select = toSelect(justificationColumns, 'j')
  const sql = `
    select 
      ${select}
    from 
      justifications j
        join statement_compounds sc on 
              j.basis_type = $1 
          and j.basis_id = sc.statement_compound_id
      where 
            j.deleted is null
        and sc.deleted is null
        and sc.statement_compound_id = $2 
  `
  const args = [
    JustificationBasisType.STATEMENT_COMPOUND,
    statementCompoundId,
  ]
  return {
    sql,
    args
  }
}

function makeSourceExcerptParaphraseJustificationClause(sourceExcerptParaphraseId, justificationColumns) {
  const select = toSelect(justificationColumns, 'j')
  const sql = `
    select 
      ${select}
    from 
      justifications j
        join justification_basis_compounds jbc on 
              j.basis_type = $1 
          and j.basis_id = jbc.justification_basis_compound_id
        join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
        join source_excerpt_paraphrases sep on
              jbca.entity_type = $2 
          and jbca.entity_id = sep.source_excerpt_paraphrase_id
      where 
            j.deleted is null
        and sep.deleted is null
        and sep.source_excerpt_paraphrase_id = $3 
  `
  const args = [
    JustificationBasisType.STATEMENT_COMPOUND,
    JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
    sourceExcerptParaphraseId,
  ]
  return {
    sql,
    args
  }
}

function makeStatementJustificationClause(statementId, justificationColumns) {
  const justificationTableAlias = 'j'
  const select = toSelect(justificationColumns, justificationTableAlias)
  return [
    // Statement compound statements
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join statement_compounds sc on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = sc.statement_compound_id
            join statement_compound_atoms sca using (statement_compound_id)
          where 
                ${justificationTableAlias}.deleted is null
            and sc.deleted is null
            and sca.statement_id = $2
      `,
      args: [
        JustificationBasisType.STATEMENT_COMPOUND,
        statementId,
      ]
    },
    // compound justification statements
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join statements s on 
                  jbca.entity_type = $2
              and jbca.entity_id = s.statement_id
          where 
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and s.statement_id = $3
      `,
      args: [
        JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomType.STATEMENT,
        statementId,
      ]
    },
    // paraphrasing statements
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join justification_basis_compounds jbc on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  jbca.entity_type = $2
              and jbca.entity_id = sep.source_excerpt_paraphrase_id
            join statements ps on 
              sep.paraphrasing_statement_id = ps.statement_id
          where 
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and ps.statement_id = $3
      `,
      args: [
        JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
        statementId,
      ]
    }
  ]
}

function makeFilteredJustificationClauses(logger, filters, sorts) {

  const clauses = []

  const columnNames = [
    'justification_id'
  ]
  forEach(sorts, sort => {
    const sortProperty = sort.property
    // We already include the ID, so ignore it
    if (sortProperty !== 'id') {
      const columnName = snakeCase(sortProperty)
      columnNames.push(columnName)
    }
  })

  forEach(filters, (filterValue, filterName) => {
    if (!filterValue) {
      logger.warn(`skipping filter ${filterName} because it has no value`)
      return
    }
    switch (filterName) {
      case 'statementId': {
        pushAll(clauses, makeStatementJustificationClause(filterValue, columnNames))
        break
      }
      case 'statementCompoundId': {
        clauses.push(makeStatementCompoundJustificationClause(filterValue, columnNames))
        break
      }
      case 'sourceExcerptParaphraseId': {
        clauses.push(makeSourceExcerptParaphraseJustificationClause(filterValue, columnNames))
        break
      }
      case 'writQuoteId': {
        pushAll(clauses, makeWritQuoteJustificationClause(filterValue, columnNames))
        break
      }
      case 'writId': {
        pushAll(clauses, makeWritJustificationClause(filterValue, columnNames))
        break
      }
      default:
        throw newImpossibleError(`Unsupported justification filter: ${filterName}`)
    }
  })

  if (clauses.length < 1) {
    clauses.push(makeDefaultJustificationSql(columnNames))
  }

  return clauses
}

function makeLimitedJustificationsOrderClauseParts(sorts, isContinuation, tableAlias) {
  const args = []
  const whereConditionSqls = []
  const orderByExpressionSqls = []

  const continuationWhereConditionSqls = []
  const prevContinuationWhereConditionSqls = []
  forEach(sorts, sort => {

    // The default direction is ascending, so if it is missing that's ok
    const direction = sort.direction === SortDirection.DESCENDING ?
      DatabaseSortDirection.DESCENDING :
      DatabaseSortDirection.ASCENDING

    const sortProperty = sort.property
    // 'id' is a special property name for entities. The column is prefixed by the entity type
    const columnName = sortProperty === 'id' ? 'justification_id' : snakeCase(sortProperty)

    whereConditionSqls.push(`${tableAlias}.${columnName} is not null`)
    orderByExpressionSqls.push(`${tableAlias}.${columnName} ${direction}`)

    if (isContinuation) {
      let operator = direction === DatabaseSortDirection.ASCENDING ? '>' : '<'
      const value = sort.value
      args.push(value)
      const currContinuationWhereSql = concat(prevContinuationWhereConditionSqls, [`${tableAlias}.${columnName} ${operator} $${args.length}`])
      continuationWhereConditionSqls.push(currContinuationWhereSql.join(' and '))
      prevContinuationWhereConditionSqls.push(`${tableAlias}.${columnName} = $${args.length}`)
    }
  })

  if (continuationWhereConditionSqls.length > 0) {
    whereConditionSqls.push(`(
      ${continuationWhereConditionSqls.join('\n or ')}
    )`)
  }

  const whereConditionsSql = whereConditionSqls.join('\n and ')
  const orderByExpressionsSql = orderByExpressionSqls.join(', ')

  return {
    whereConditionsSql,
    orderByExpressionsSql,
    args,
  }
}

/** Generates SQL and arguments for limit-querying filtered justifications.
 *
 * @param logger - a logger
 * @param filters object - key values of values upon which to filter.
 * @param sorts {property, direction} - an array of instructions for sorting the justifications
 * @param count integer - the maximum number of justifications to return
 * @param isContinuation boolean - whether the query is a continuation of a pagination query
 */
function makeLimitedJustificationsClause(logger, filters, sorts, count, isContinuation) {

  const tableAlias = 'j'

  const {
    whereConditionsSql,
    orderByExpressionsSql,
    args,
  } = makeLimitedJustificationsOrderClauseParts(sorts, isContinuation, tableAlias)

  const filteredJustificationClauses = makeFilteredJustificationClauses(logger, filters, sorts)
  const renumberedFilteredJustificationClauseSqls = []
  forEach(filteredJustificationClauses, (filterClause) => {
    renumberedFilteredJustificationClauseSqls.push(renumberSqlArgs(filterClause.sql, args.length))
    pushAll(args, filterClause.args)
  })

  const whereSql = whereConditionsSql ? 'where ' + whereConditionsSql : ''
  const orderBySql = orderByExpressionsSql ? 'order by ' + orderByExpressionsSql : ''

  args.push(count)
  const sql = `
    select ${tableAlias}.* 
    from (
      ${renumberedFilteredJustificationClauseSqls.join('\n union \n')}
    ) ${tableAlias}
    ${whereSql}
    ${orderBySql}
    limit $${args.length}
  `

  return {
    sql: sql,
    args: args,
  }
}

function makeJustificationsQueryOrderByExpressionsSql(sorts, tableAlias) {
  const orderByExpressionSqls = []
  const tablePrefix = tableAlias ? tableAlias + '.' : ''
  forEach(sorts, sort => {
    // The default direction is ascending, so if it is missing that's ok
    const direction = sort.direction === SortDirection.DESCENDING ?
      DatabaseSortDirection.DESCENDING :
      DatabaseSortDirection.ASCENDING

    const sortProperty = sort.property
    // 'id' is a special property name for entities. The column is prefixed by the entity type
    const columnName = sortProperty === 'id' ? 'justification_id' : snakeCase(sortProperty)

    orderByExpressionSqls.push(`${tablePrefix}${columnName} ${direction}`)
  })

  return orderByExpressionSqls.join(', ')
}

function getNewJustificationRootPolarity(justification, logger, database) {
  return Promise.resolve()
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
}

function getTargetRootPolarity(logger, database, justification) {
  return database.query('select root_polarity from justifications where justification_id = $1', [justification.target.entity.id])
    .then( ({rows}) => {
      if (rows.length < 1) {
        throw new EntityNotFoundError(`Could not create justification because target justification having ID ${justification.target.id} did not exist`)
      } else if (rows.length > 1) {
        logger.error(`while creating justification, found more than one target justification having ID ${justification.target.id}`)
      }

      const {root_polarity} = head(rows)
      return root_polarity
    })
}
