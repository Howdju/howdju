const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const flatMap = require('lodash/flatMap')
const has = require('lodash/has')
const head = require('lodash/head')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const Promise = require('bluebird')
const snakeCase = require('lodash/snakeCase')

const {
  assert,
  isDefined,
  doTargetSameRoot,
  JustificationBasisCompoundAtomType,
  JustificationBasisType,
  JustificationPolarity,
  JustificationRootTargetType,
  JustificationTargetType,
  negateRootPolarity,
  newExhaustedEnumError,
  newImpossibleError,
  pushAll,
  requireArgs,
  SortDirection,
  SourceExcerptType,
} = require('howdju-common')

const {
  toJustification,
  toPropositionCompound,
  toPropositionCompoundAtom,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toWritQuote,
  toProposition,
} = require('./orm')
const {EntityNotFoundError} = require('../serviceErrors')
const {
  groupRootJustifications,
  renumberSqlArgs,
} = require('./daosUtil')
const {DatabaseSortDirection} = require('./daoModels')


exports.JustificationsDao = class JustificationsDao {

  constructor(logger, database, statementsDao, propositionCompoundsDao, writQuotesDao, justificationBasisCompoundsDao) {
    requireArgs({
      logger,
      database,
      statementsDao,
      propositionCompoundsDao,
      writQuotesDao,
      justificationBasisCompoundsDao
    })
    this.logger = logger
    this.database = database
    this.statementsDao = statementsDao
    this.propositionCompoundsDao = propositionCompoundsDao
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
      JustificationRootTargetType.PROPOSITION,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.PROPOSITION_COMPOUND,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.PROPOSITION,
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
        , ${tableAlias}.root_target_type
        , ${tableAlias}.root_target_id
        , ${tableAlias}.root_polarity
        , ${tableAlias}.target_type
        , ${tableAlias}.target_id
        , ${tableAlias}.basis_type
        , ${tableAlias}.basis_id
        , ${tableAlias}.polarity
        , ${tableAlias}.creator_user_id
        , ${tableAlias}.created
        
        , rp.proposition_id       as root_target_proposition_id
        , rp.text                 as root_target_proposition_text
        , rp.created              as root_target_proposition_created
        , rp.creator_user_id      as root_target_proposition_creator_user_id
        
        , wq.writ_quote_id          as basis_writ_quote_id
        , wq.quote_text             as basis_writ_quote_quote_text
        , wq.created                as basis_writ_quote_created
        , wq.creator_user_id        as basis_writ_quote_creator_user_id
        , w.writ_id                 as basis_writ_quote_writ_id
        , w.title                   as basis_writ_quote_writ_title
        , w.created                 as basis_writ_quote_writ_created
        , w.creator_user_id         as basis_writ_quote_writ_creator_user_id
        
        , sc.proposition_compound_id  as basis_proposition_compound_id
        , sca.order_position        as basis_proposition_compound_atom_order_position
        , scas.proposition_id         as basis_proposition_compound_atom_proposition_id
        , scas.text                 as basis_proposition_compound_atom_proposition_text
        , scas.created              as basis_proposition_compound_atom_proposition_created
        , scas.creator_user_id      as basis_proposition_compound_atom_proposition_creator_user_id
        
        , jbc.justification_basis_compound_id          as basis_jbc_id
        , jbca.justification_basis_compound_atom_id    as basis_jbc_atom_id
        , jbca.entity_type                             as basis_jbc_atom_entity_type
        , jbca.order_position                          as basis_jbc_atom_order_position
        
        , jbcas.proposition_id                           as basis_jbc_atom_proposition_id
        , jbcas.text                                   as basis_jbc_atom_proposition_text
        , jbcas.created                                as basis_jbc_atom_proposition_created
        , jbcas.creator_user_id                        as basis_jbc_atom_proposition_creator_user_id
        
        , sep.source_excerpt_paraphrase_id             as basis_jbc_atom_sep_id
        , sep_s.proposition_id                           as basis_jbc_atom_sep_paraphrasing_proposition_id
        , sep_s.text                                   as basis_jbc_atom_sep_paraphrasing_proposition_text
        , sep_s.created                                as basis_jbc_atom_sep_paraphrasing_proposition_created
        , sep_s.creator_user_id                        as basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id
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
          
          join propositions rp on
                ${tableAlias}.root_target_type = $1 
            and ${tableAlias}.root_target_id = rp.proposition_id
          
          left join writ_quotes wq on 
                ${tableAlias}.basis_type = $2
            and ${tableAlias}.basis_id = wq.writ_quote_id 
          left join writs w using (writ_id)
          
          left join proposition_compounds sc on 
                ${tableAlias}.basis_type = $3
            and ${tableAlias}.basis_id = sc.proposition_compound_id
          left join proposition_compound_atoms sca using (proposition_compound_id)
          left join propositions scas on sca.proposition_id = scas.proposition_id
          
          left join justification_basis_compounds jbc on
                ${tableAlias}.basis_type = $4
            and ${tableAlias}.basis_id = jbc.justification_basis_compound_id
          left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          left join propositions jbcas on
                jbca.entity_type = $5
            and jbca.entity_id = jbcas.proposition_id
          left join source_excerpt_paraphrases sep on
                jbca.entity_type = $6
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
          left join propositions sep_s on
                sep.paraphrasing_proposition_id = sep_s.proposition_id
          left join writ_quotes sep_wq on
                sep.source_excerpt_type = $7
            and sep.source_excerpt_id = sep_wq.writ_quote_id
          left join writs sep_wqw on
                sep_wq.writ_id = sep_wqw.writ_id
        where
              ${tableAlias}.deleted is null
          and rp.deleted is null
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
      JustificationRootTargetType.PROPOSITION,
      JustificationTargetType.JUSTIFICATION,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.PROPOSITION_COMPOUND,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.PROPOSITION,
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
        , tj.root_target_type       as ${targetJustificationPrefix}root_target_type
        , tj.root_target_id         as ${targetJustificationPrefix}root_target_id
        , tj.root_polarity          as ${targetJustificationPrefix}root_polarity
        , tj.target_type            as ${targetJustificationPrefix}target_type
        , tj.target_id              as ${targetJustificationPrefix}target_id
        , tj.basis_type             as ${targetJustificationPrefix}basis_type
        , tj.basis_id               as ${targetJustificationPrefix}basis_id
        , tj.polarity               as ${targetJustificationPrefix}polarity
        , tj.creator_user_id        as ${targetJustificationPrefix}creator_user_id
        , tj.created                as ${targetJustificationPrefix}created
        
        , rp.proposition_id         as ${targetJustificationPrefix}root_target_proposition_id
        , rp.text                   as ${targetJustificationPrefix}root_target_proposition_text
        , rp.created                as ${targetJustificationPrefix}root_target_proposition_created
        , rp.creator_user_id        as ${targetJustificationPrefix}root_target_proposition_creator_user_id
        
        , wq.writ_quote_id          as ${targetJustificationPrefix}basis_writ_quote_id
        , wq.quote_text             as ${targetJustificationPrefix}basis_writ_quote_quote_text
        , wq.created                as ${targetJustificationPrefix}basis_writ_quote_created
        , wq.creator_user_id        as ${targetJustificationPrefix}basis_writ_quote_creator_user_id
        , w.writ_id                 as ${targetJustificationPrefix}basis_writ_quote_writ_id
        , w.title                   as ${targetJustificationPrefix}basis_writ_quote_writ_title
        , w.created                 as ${targetJustificationPrefix}basis_writ_quote_writ_created
        , w.creator_user_id         as ${targetJustificationPrefix}basis_writ_quote_writ_creator_user_id
        
        , sc.proposition_compound_id  as ${targetJustificationPrefix}basis_proposition_compound_id
        , sca.order_position        as ${targetJustificationPrefix}basis_proposition_compound_atom_order_position
        , scas.proposition_id         as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_id
        , scas.text                 as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_text
        , scas.created              as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_created
        , scas.creator_user_id      as ${targetJustificationPrefix}basis_proposition_compound_atom_proposition_creator_user_id
        
        , jbc.justification_basis_compound_id        as ${targetJustificationPrefix}basis_jbc_id
        , jbca.justification_basis_compound_atom_id  as ${targetJustificationPrefix}basis_jbc_atom_id
        , jbca.entity_type                           as ${targetJustificationPrefix}basis_jbc_atom_entity_type
        , jbca.order_position                        as ${targetJustificationPrefix}basis_jbc_atom_order_position
        
        , jbcas.proposition_id                         as ${targetJustificationPrefix}basis_jbc_atom_proposition_id
        , jbcas.text                                 as ${targetJustificationPrefix}basis_jbc_atom_proposition_text
        , jbcas.created                              as ${targetJustificationPrefix}basis_jbc_atom_proposition_created
        , jbcas.creator_user_id                      as ${targetJustificationPrefix}basis_jbc_atom_proposition_creator_user_id
        
        , sep.source_excerpt_paraphrase_id           as ${targetJustificationPrefix}basis_jbc_atom_sep_id
        , sep_s.proposition_id                         as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_id
        , sep_s.text                                 as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_text
        , sep_s.created                              as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_created
        , sep_s.creator_user_id                      as ${targetJustificationPrefix}basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id
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
         
          join propositions rp on
                ${tableAlias}.root_target_type = $1 
            and ${tableAlias}.root_target_id = rp.proposition_id
          
          join justifications tj on 
                ${tableAlias}.target_type = $2
            and ${tableAlias}.target_id = tj.justification_id 
          
          left join writ_quotes wq on 
                tj.basis_type = $3
            and tj.basis_id = wq.writ_quote_id 
          left join writs w on wq.writ_id = w.writ_id
          
          left join proposition_compounds sc on 
                tj.basis_type = $4
            and tj.basis_id = sc.proposition_compound_id
          left join proposition_compound_atoms sca using (proposition_compound_id)
          left join propositions scas on sca.proposition_id = scas.proposition_id
          
          left join justification_basis_compounds jbc on
                tj.basis_type = $5
            and tj.basis_id = jbc.justification_basis_compound_id
          left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          left join propositions jbcas on
                jbca.entity_type = $6
            and jbca.entity_id = jbcas.proposition_id
          left join source_excerpt_paraphrases sep on
                jbca.entity_type = $7
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
          left join propositions sep_s on
                sep.paraphrasing_proposition_id = sep_s.proposition_id
          left join writ_quotes sep_wq on
                sep.source_excerpt_type = $8
            and sep.source_excerpt_id = sep_wq.writ_quote_id
          left join writs sep_wqw on
                sep_wq.writ_id = sep_wqw.writ_id
        where
              ${tableAlias}.deleted is null
          and rp.deleted is null
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

    const targetPropositionsSelectArgs = [
      JustificationTargetType.PROPOSITION,
    ]
    const targetPropositionsRenumberedLimitedJustificationsSql = renumberSqlArgs(limitedJustificationsSql, targetPropositionsSelectArgs.length)
    const targetPropositionsArgs = concat(targetPropositionsSelectArgs, limitedJustificationsArgs)
    const targetPropositionsSql = `
      with
        limited_justifications as (
          ${targetPropositionsRenumberedLimitedJustificationsSql}
        )
      select 
          tp.proposition_id
        , tp.text
        , tp.created
        , tp.creator_user_id
      from limited_justifications lj
          join justifications j using (justification_id)
          join propositions tp on 
                j.target_type = $1
            and j.target_id = tp.proposition_id
        where
              j.deleted is null
          and tp.deleted is null
      -- no need to order because they are joined to the ordered targeting justifications
    `
    return Promise.all([
      this.database.query('readJustifications', justificationsSql, justificationsArgs),
      this.database.query('readJustifications.targetJustifications', targetJustificationsSql, targetJustificationsArgs),
      this.database.query('readJustifications.targetPropositions', targetPropositionsSql, targetPropositionsArgs),
    ])
      .then( ([
        {rows: justificationRows},
        {rows: targetJustificationRows},
        {rows: targetPropositionRows},
      ]) => {
        const justifications = mapJustificationRows(justificationRows)
        const targetJustificationsById = mapJustificationRowsById(targetJustificationRows, targetJustificationPrefix)
        const targetPropositionsById = mapPropositionRowsById(targetPropositionRows)

        forEach(justifications, justification => {
          let target
          switch (justification.target.type) {
            case JustificationTargetType.JUSTIFICATION: {
              target = targetJustificationsById[justification.target.entity.id]
              break
            }
            case JustificationTargetType.PROPOSITION: {
              target = targetPropositionsById[justification.target.entity.id]
              break
            }
            default: {
              throw newExhaustedEnumError('JustificationTargetType', justification.target.type)
            }
          }
          if (!target) {
            this.logger.error(`Justification ${justification.id} is missing it's target justification ${justification.target.entity.id}`)
          }

          justification.target.entity = target
        })

        return justifications
      })
      .then((justifications) => {
        // Add the statements here at the end; it is too much trouble to add them into the joins above;
        // we can add them into the joins, if that makes sense, after we remove the deprecated justification basis types
        addStatements(this, justifications)
        return justifications
      })
  }

  readJustificationsWithBasesAndVotesByRootTarget(rootTargetType, rootTargetId, {userId}) {
    const sql = `
      with 
        extant_users as (select * from users where deleted is null)
      select 
          j.*
        , v.justification_vote_id
        , v.polarity    as vote_polarity
        , v.justification_id   as vote_justification_id
        , u.long_name as creator_user_long_name
      from justifications j 
        left join extant_users u on j.creator_user_id = u.user_id
        left join proposition_compounds sc on 
              j.basis_type = $5
          and j.basis_id = sc.proposition_compound_id 
        left join writ_quotes wq on 
              j.basis_type = $4
          and j.basis_id = wq.writ_quote_id
        left join justification_votes v on 
              j.justification_id = v.justification_id
          and v.user_id = $3
          and v.deleted IS NULL
        where 
              j.deleted is null
          and j.root_target_type = $1
          and j.root_target_id = $2
      `
    return Promise.all([
      this.database.query('readJustificationsWithBasesAndVotesByRootTarget', sql,
        [rootTargetType, rootTargetId, userId, JustificationBasisType.WRIT_QUOTE, JustificationBasisType.PROPOSITION_COMPOUND]),
      // We won't support adding legacy justification basis types to statements
      rootTargetType === JustificationRootTargetType.PROPOSITION ?
        readPropositionCompoundsByIdForRootPropositionId(this, rootTargetId, {userId}) : [],
      rootTargetType === JustificationRootTargetType.PROPOSITION ?
        this.writQuotesDao.readWritQuotesByIdForRootPropositionId(rootTargetId) : [],
      rootTargetType === JustificationRootTargetType.PROPOSITION ?
        this.justificationBasisCompoundsDao.readJustificationBasisCompoundsByIdForRootPropositionId(rootTargetId)
        : [],
    ])
      .then( ([
        {rows: justification_rows},
        propositionCompoundsById,
        writQuotesById,
        justificationBasisCompoundsById
      ]) => {
        const {rootJustifications, counterJustificationsByJustificationId} =
          groupRootJustifications(rootTargetType, rootTargetId, justification_rows)
        return map(rootJustifications, j =>
          toJustification(j, counterJustificationsByJustificationId, propositionCompoundsById, writQuotesById, justificationBasisCompoundsById))
      })
      .then((justifications) => {
        addStatements(this, justifications)
        return justifications
      })
  }

  readJustificationsDependentUponPropositionId(propositionId) {
    const sql = `
      select * from justifications where
            root_target_type = $1
        and root_target_id = $2
      union
        select j.* 
        from justifications j 
          join proposition_compounds sc on 
                j.basis_type = $3
            and j.basis_id = sc.proposition_compound_id
          join proposition_compound_atoms pca using (proposition_compound_id)
          join propositions pcap on
                pca.proposition_id = pcap.proposition_id
            and pcap.proposition_id = $2
    `
    return this.database.query('readJustificationsDependentUponPropositionId', sql,
      [JustificationRootTargetType.PROPOSITION, propositionId, JustificationBasisType.PROPOSITION_COMPOUND]
    )
      .then( ({rows}) => map(rows, toJustification))
      .then((justifications) => {
        addStatements(this, justifications)
        return justifications
      })
  }

  readJustificationForId(justificationId) {
    return this.database.query(
      'readJustificationForId',
      'select * from justifications where justification_id = $1 and deleted is null',
      [justificationId]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`More than one justification has ID ${justificationId}`)
        }
        return toJustification(head(rows))
      })
      .then((justification) => {
        addStatements(this, [justification])
        return justification
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
    return this.database.query('readJustificationEquivalentTo', sql, args)
      .then( ({rows}) => toJustification(head(rows)) )
      .then(equivalentJustification => {
        assert(
          () => !equivalentJustification || doTargetSameRoot(equivalentJustification, justification),
          () => `justification's (${justification.id}) rootTarget ${justification.rootTargetType} ${justification.rootTarget.id} does not` +
            ` equal equivalent justification's (${equivalentJustification.id}) rootTarget ${justification.rootTargetType} ${equivalentJustification.rootTarget.id}`
        )
        return equivalentJustification
      })
      .then((justification) => {
        if (justification) {
          addStatements(this, [justification])
        }
        return justification
      })
  }

  readRootJustificationCountByPolarityForRoot(rootTargetType, rootTargetId) {
    return this.database.query('readRootJustificationCountByPolarityForRoot', `
      select polarity, count(*) as count
      from justifications
        where 
              root_target_type = $1
          and root_target_id = $2
          and target_type = $1
          and target_id = $2
      group by polarity
    `, [rootTargetType, rootTargetId])
      .then( ({rows}) => {
        const rootJustificationCountByPolarity = {}
        forEach(rows, row => {
          rootJustificationCountByPolarity[row.polarity] = row.count
        })
        return rootJustificationCountByPolarity
      })
  }

  createJustification(justification, userId, now) {

    return getNewJustificationRootPolarity(justification, this.logger, this.database)
      .then((rootPolarity) => {
        const sql = `
          insert into justifications
            (root_target_type, root_target_id, root_polarity, target_type, target_id, basis_type, basis_id, polarity, creator_user_id, created)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          returning *
          `
        const args = [
          justification.rootTargetType,
          justification.rootTarget.id,
          rootPolarity,
          justification.target.type,
          justification.target.entity.id,
          justification.basis.type,
          justification.basis.entity.id,
          justification.polarity,
          userId,
          now,
        ]
        return this.database.query('createJustification', sql, args)
      })
      .then( ({rows: [row]}) => toJustification(row))
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
    return this.database.query(
      'deleteJustificationById',
      'update justifications set deleted = $2 where justification_id = $1 returning justification_id',
      [justificationId, now]
    )
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
    return this.database.query(
      'deleteCounterJustificationsToJustificationIds',
      `
        update justifications set deleted = $1 
        where 
              target_type = $2
          and target_id = any ($3) 
        returning justification_id`,
      [now, JustificationTargetType.JUSTIFICATION, justificationIds]
    ).then( ({rows}) => map(rows, row => row.justification_id))
  }
}

function addStatements(service, justifications) {
  // Collect all the statements we need to read, as well as the justifications that need them as rootTargets and targets
  const statementIds = new Set()
  const justificationsByRootTargetStatementId = new Map()
  const justificationsByTargetStatementId = new Map()
  for (const justification of justifications) {
    if (justification.rootTargetType === JustificationRootTargetType.STATEMENT) {
      statementIds.add(justification.rootTarget.id)

      let justificationsRootedInStatementId = justificationsByRootTargetStatementId.get(justification.rootTarget.id)
      if (!justificationsRootedInStatementId) {
        justificationsByRootTargetStatementId.set(
          justification.rootTarget.id,
          justificationsRootedInStatementId = []
        )
      }

      justificationsRootedInStatementId.push(justification)
    }
    if (justification.target.type === JustificationTargetType.STATEMENT) {
      // It is not possible to target a statement that is not also the root statement, so we don't need to add
      // to statementIds here since we did it above.

      let justificationsTargetingStatementId = justificationsByTargetStatementId.get(justification.target.id)
      if (!justificationsTargetingStatementId) {
        justificationsByTargetStatementId.set(
          justification.target.id,
          justificationsTargetingStatementId = []
        )
      }

      justificationsTargetingStatementId.push(justification)
    }
  }

  // Query each statement, and insert it into the justifications that need it.
  for (const statementId of statementIds.values()) {
    const statement = service.statementsDao.readStatementForId(statementId)

    const justificationsRootTargetingStatement = justificationsByRootTargetStatementId.get(statement.id)
    if (justificationsRootTargetingStatement) {
      for (const justification of justificationsRootTargetingStatement) {
        justification.rootTarget = statement
      }
    }

    const justificationsTargetingStatement = justificationsByTargetStatementId.get(statement.id)
    if (justificationsTargetingStatement) {
      for (const justification of justificationsTargetingStatement) {
        justification.target.entity = statement
      }
    }
  }
}

/** Directly return an object of the justifications keyed by their ID */
function mapJustificationRowsById(rows, prefix = '') {
  const [justificationsById] = mapJustificationRowsWithOrdering(rows, prefix)
  return justificationsById
}

function mapPropositionRowsById(rows) {
  const byId = {}
  forEach(rows, row => {
    const proposition = toProposition(row)
    byId[proposition.id] = proposition
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
  const propositionCompoundRowsById = {}
  const propositionCompoundAtomsByCompoundId = {}
  const justificationBasisCompoundRowsById = {}
  const justificationBasisCompoundAtomsByCompoundId = {}

  forEach(rows, row => {
    const rowId = row[prefix + 'justification_id']

    if (!has(justificationRowsById, rowId)) {
      orderedJustificationIds.push(rowId)
      justificationRowsById[rowId] = {
        justification_id:            rowId,
        root_polarity:               row[prefix + 'root_polarity'],
        root_target_type:            row[prefix + 'root_target_type'],
        root_target_id:              row[prefix + 'root_target_id'],
        target_type:                 row[prefix + 'target_type'],
        target_id:                   row[prefix + 'target_id'],
        basis_type:                  row[prefix + 'basis_type'],
        basis_id:                    row[prefix + 'basis_id'],
        polarity:                    row[prefix + 'polarity'],
        creator_user_id:             row[prefix + 'creator_user_id'],
        created:                     row[prefix + 'created'],
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

    const propositionCompoundId = row[prefix + 'basis_proposition_compound_id']
    if (isDefined(propositionCompoundId)) {
      const propositionCompoundRow = propositionCompoundRowsById[propositionCompoundId]
      if (!propositionCompoundRow) {
        propositionCompoundRowsById[propositionCompoundId] = {
          proposition_compound_id: propositionCompoundId
        }
      }

      // Atoms are stored by proposition ID because proposition compound atoms don't have their own ID
      let atomsByPropositionId = propositionCompoundAtomsByCompoundId[propositionCompoundId]
      if (!atomsByPropositionId) {
        propositionCompoundAtomsByCompoundId[propositionCompoundId] = atomsByPropositionId = {}
      }
      if (!has(atomsByPropositionId, row[prefix + 'basis_proposition_compound_atom_proposition_id'])) {
        const atom = toPropositionCompoundAtom({
          proposition_compound_id:     propositionCompoundId,
          proposition_id:              row[prefix + 'basis_proposition_compound_atom_proposition_id'],
          proposition_text:            row[prefix + 'basis_proposition_compound_atom_proposition_text'],
          proposition_created:         row[prefix + 'basis_proposition_compound_atom_proposition_created'],
          proposition_creator_user_id: row[prefix + 'basis_proposition_compound_atom_proposition_creator_user_id'],
          order_position:            row[prefix + 'basis_proposition_compound_atom_order_position'],
        })
        atomsByPropositionId[atom.entity.id] = atom
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
        const atom = toJustificationBasisCompoundAtom({
          justification_basis_compound_atom_id: atomId,
          justification_basis_compound_id:      justificationBasisCompoundId,
          entity_type:                          row[prefix + 'basis_jbc_atom_entity_type'],
          order_position:                       row[prefix + 'basis_jbc_atom_order_position'],

          proposition_id:                row[prefix + 'basis_jbc_atom_proposition_id'],
          proposition_text:              row[prefix + 'basis_jbc_atom_proposition_text'],
          proposition_created:           row[prefix + 'basis_jbc_atom_proposition_created'],
          proposition_creator_user_id:   row[prefix + 'basis_jbc_atom_proposition_creator_user_id'],
          source_excerpt_paraphrase_id:                          row[prefix + 'basis_jbc_atom_sep_id'],
          source_excerpt_paraphrasing_proposition_id:              row[prefix + 'basis_jbc_atom_sep_paraphrasing_proposition_id'],
          source_excerpt_paraphrasing_proposition_text:            row[prefix + 'basis_jbc_atom_sep_paraphrasing_proposition_text'],
          source_excerpt_paraphrasing_proposition_created:         row[prefix + 'basis_jbc_atom_sep_paraphrasing_proposition_created'],
          source_excerpt_paraphrasing_proposition_creator_user_id: row[prefix + 'basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id'],
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

    assert(basisWritQuoteId || propositionCompoundId || justificationBasisCompoundId, "justification must have a basis")
  })

  const propositionCompoundsById = mapValues(propositionCompoundRowsById, (row, id) =>
    toPropositionCompound(row, propositionCompoundAtomsByCompoundId[id])
  )

  const justificationBasisCompoundsById = mapValues(justificationBasisCompoundRowsById, (row, id) =>
    toJustificationBasisCompound(row, justificationBasisCompoundAtomsByCompoundId[id])
  )

  const justificationsById = mapValues(justificationRowsById,
    row => toJustification(row, null, propositionCompoundsById, writQuotesRowsById, justificationBasisCompoundsById))
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
              and bca.entity_id = sep.source_excerpt_paraphrase_id
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

function makePropositionCompoundJustificationClause(propositionCompoundId, justificationColumns) {
  const select = toSelect(justificationColumns, 'j')
  const sql = `
    select 
      ${select}
    from 
      justifications j
        join proposition_compounds sc on 
              j.basis_type = $1 
          and j.basis_id = sc.proposition_compound_id
      where 
            j.deleted is null
        and sc.deleted is null
        and sc.proposition_compound_id = $2 
  `
  const args = [
    JustificationBasisType.PROPOSITION_COMPOUND,
    propositionCompoundId,
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
    JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
    JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
    sourceExcerptParaphraseId,
  ]
  return {
    sql,
    args
  }
}

function makePropositionJustificationClause(propositionId, justificationColumns) {
  const justificationTableAlias = 'j'
  const select = toSelect(justificationColumns, justificationTableAlias)
  return [
    // Proposition compound propositions
    {
      sql: `
        select 
          ${select}
        from 
          justifications ${justificationTableAlias}
            join proposition_compounds sc on 
                  ${justificationTableAlias}.basis_type = $1 
              and ${justificationTableAlias}.basis_id = sc.proposition_compound_id
            join proposition_compound_atoms sca using (proposition_compound_id)
          where 
                ${justificationTableAlias}.deleted is null
            and sc.deleted is null
            and sca.proposition_id = $2
      `,
      args: [
        JustificationBasisType.PROPOSITION_COMPOUND,
        propositionId,
      ]
    },
    // compound justification propositions
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
            join propositions s on 
                  jbca.entity_type = $2
              and jbca.entity_id = s.proposition_id
          where 
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and s.proposition_id = $3
      `,
      args: [
        JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomType.PROPOSITION,
        propositionId,
      ]
    },
    // paraphrasing propositions
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
            join propositions ps on 
              sep.paraphrasing_proposition_id = ps.proposition_id
          where 
                ${justificationTableAlias}.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and ps.proposition_id = $3
      `,
      args: [
        JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
        propositionId,
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
      case 'propositionId': {
        pushAll(clauses, makePropositionJustificationClause(filterValue, columnNames))
        break
      }
      case 'propositionCompoundId': {
        clauses.push(makePropositionCompoundJustificationClause(filterValue, columnNames))
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
        case JustificationTargetType.PROPOSITION:
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
  return database.query(
    'getTargetRootPolarity',
    'select root_polarity from justifications where justification_id = $1',
    [justification.target.entity.id]
  )
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

function readPropositionCompoundsByIdForRootPropositionId(dao, rootPropositionId, {userId}) {
  return dao.propositionCompoundsDao.readPropositionCompoundsByIdForRootPropositionId(rootPropositionId, {userId})
    .then( (propositionCompoundsById) =>
      Promise.all([
        propositionCompoundsById,
        addRootJustificationCountByPolarity(dao, propositionCompoundsById),
      ])
    )
    .then( ([propositionCompoundsById]) => propositionCompoundsById)
}

function addRootJustificationCountByPolarity(dao, propositionCompoundsById) {
  return Promise.all(flatMap(propositionCompoundsById, (propositionCompound) => propositionCompound.atoms))
    .then( (atoms) => Promise.all(map(atoms, (atom) =>
      Promise.all([
        atom.entity,
        dao.readRootJustificationCountByPolarityForRoot(JustificationRootTargetType.PROPOSITION, atom.entity.id),
      ])
    )))
    .then( (propositionAndJustificationCounts) => Promise.all(map(propositionAndJustificationCounts, ([proposition, rootJustificationCountByPolarity]) => {
      proposition.rootJustificationCountByPolarity = rootJustificationCountByPolarity
    })))
}