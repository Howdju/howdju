const forEach = require('lodash/forEach')
const values = require('lodash/values')

const {
  VoteTargetType,
  JustificationBasisType,
  JustificationTargetType,
  newImpossibleError,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
  assert,
  isTruthy,
  newExhaustedEnumError,
} = require('howdju-common')

const {
  toPerspective,
  toJustification,
  toStatementCompound,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toStatement,
  toStatementCompoundAtom,
  toUrl,
  toWrit,
  toWritQuote,
} = require('./orm')


exports.PerspectivesDao = class PerspectivesDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  /** All justifications must be included in the perspective.
   *
   * See <premiser-processing>/src/perspectiveService for a more complicated approach of inferring included justifications
   * across root statement boundaries, but that has the added difficulties of multiple paths from perspective-justification
   * to perspective-statement.
   */
  readFeaturedPerspectivesWithVotes({userId}) {
    const args = [
      JustificationBasisType.STATEMENT_COMPOUND,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.STATEMENT,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptType.WRIT_QUOTE,
    ]
    if (userId) {
      args.push(VoteTargetType.JUSTIFICATION)
      args.push(userId)
    }

    const votesSelectSql = userId ? `
        , v.vote_id
        , v.polarity AS vote_polarity
        , v.target_type AS vote_target_type
        , v.target_id AS vote_target_id
        ` :
      ''
    const votesJoinSql = userId ? `
        left join votes v on 
              v.target_type = $7
          and j.justification_id = v.target_id
          and v.user_id = $8
          and v.deleted IS NULL
        ` :
      ''
    const perspectiveJustificationsSql = `
      select 
          p.perspective_id
        , p.creator_user_id         as perspective_creator_user_id
        , p.statement_id            as perspective_statement_id
        , ps.text                   as perspective_statement_text
        , ps.creator_user_id        as perspective_statement_creator_user_id
        , ps.created                as perspective_statement_created
        , j.*
        , sc.statement_compound_id  as basis_statement_compound_id
        , sca.statement_id          as basis_statement_compound_atom_statement_id
        , sca.order_position        as basis_statement_compound_atom_order_position
        , scas.text                 as basis_statement_compound_atom_statement_text
        , scas.created              as basis_statement_compound_atom_statement_created
        , scas.creator_user_id      as basis_statement_compound_atom_statement_creator_user_id
        , wq.writ_quote_id          as basis_writ_quote_id
        , wq.quote_text             as basis_writ_quote_quote_text
        , wq.created                as basis_writ_quote_created
        , wq.creator_user_id        as basis_writ_quote_creator_user_id
        , w.writ_id                 as basis_writ_quote_writ_id
        , w.title                   as basis_writ_quote_writ_title
        , w.created                 as basis_writ_quote_writ_created
        , w.creator_user_id         as basis_writ_quote_writ_creator_user_id
        , cru.url_id                as basis_writ_quote_url_id
        , u.url                     as basis_writ_quote_url_url
        
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
        
        ${votesSelectSql}
      from perspectives p 
        join statements ps on 
              p.is_featured
          and p.statement_id = ps.statement_id
          and p.deleted is null
          and ps.deleted is null
        join perspective_justifications pj on
              p.perspective_id = pj.perspective_id
        join justifications j on
              j.deleted is null
          and pj.justification_id = j.justification_id
          
        left join statement_compounds sc on
              j.basis_type = $1
          and j.basis_id = sc.statement_compound_id
          and sc.deleted is null
        left join statement_compound_atoms sca on
              sc.statement_compound_id = sca.statement_compound_id
        left join statements scas on
              sca.statement_id = scas.statement_id
          and scas.deleted is null
          
        left join justification_basis_compounds jbc on
              j.basis_type = $3
          and j.basis_id = jbc.justification_basis_compound_id
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
          
        left join writ_quotes wq on
              j.basis_type = $2
          and j.basis_id = wq.writ_quote_id
          and wq.deleted is null
        left join writs w on
              wq.writ_id = w.writ_id
          and w.deleted is null
        left join writ_quote_urls cru on
             wq.writ_quote_id = cru.writ_quote_id
         and cru.deleted is null
        left join urls u on
              cru.url_id = u.url_id
          and u.deleted is null
        ${votesJoinSql}
        order by sca.order_position
    `
    return this.database.query(perspectiveJustificationsSql, args)
      .then( ({rows}) => this._postProcessRows(rows))
  }

  _postProcessRows(rows) {
    const {
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByCompoundId,
      justificationBasisCompoundsById,
      justificationBasisCompoundAtomsByCompoundId,
      statementsById,
      writQuotesById,
      writsById,
      urlsByWritQuoteId,
    } = this._indexRows(rows)

    this._connectEverything(
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByCompoundId,
      justificationBasisCompoundsById,
      justificationBasisCompoundAtomsByCompoundId,
      statementsById,
      writQuotesById,
      writsById,
      urlsByWritQuoteId
    )

    return values(perspectivesById)
  }

  _indexRows(rows) {
    const perspectivesById = {}
    const justificationsById = {}
    const statementCompoundsById = {}
    const statementCompoundAtomsByCompoundId = {}
    const justificationBasisCompoundsById = {}
    const justificationBasisCompoundAtomsByCompoundId = {}
    const statementsById = {}
    const writQuotesById = {}
    const writsById = {}
    const urlsById = {}
    const urlsByWritQuoteId = {}

    forEach(rows, row => {

      let perspective = perspectivesById[row.perspective_id]
      if (!perspective) {
        perspectivesById[row.perspective_id] = perspective = toPerspective({
          perspective_id: row.perspective_id,
          creator_user_id: row.perspective_creator_user_id,
          statement_id: row.perspective_statement_id,
        })
      }
      let perspectiveStatement = statementsById[perspective.statement.id]
      if (!perspectiveStatement) {
        statementsById[perspective.statement.id] = toStatement({
          statement_id: row.perspective_statement_id,
          text: row.perspective_statement_text,
          creator_user_id: row.perspective_statement_creator_user_id,
          created: row.perspectivce_statement_created,
        })
      }

      const justification = justificationsById[row.justification_id]
      if (!justification) {
        justificationsById[row.justification_id] = toJustification(row)
      }

      if (row.basis_statement_compound_id) {
        let statementCompound = statementCompoundsById[row.basis_statement_compound_id]
        if (!statementCompound) {
          statementCompoundsById[row.basis_statement_compound_id] = statementCompound = toStatementCompound({
            statement_compound_id: row.basis_statement_compound_id
          })
        }

        let statementCompoundAtoms = statementCompoundAtomsByCompoundId[statementCompound.id]
        if (!statementCompoundAtoms) {
          statementCompoundAtomsByCompoundId[statementCompound.id] = statementCompoundAtoms = []
        }
        const statementCompoundAtom = toStatementCompoundAtom({
          statement_compound_id: statementCompound.id,
          statement_id: row.basis_statement_compound_atom_statement_id,
          order_position: row.basis_statement_compound_atom_order_position,
        })
        statementCompoundAtoms.push(statementCompoundAtom)

        const statement = statementsById[statementCompoundAtom.entity.id]
        if (!statement) {
          statementsById[statementCompoundAtom.entity.id] = toStatement({
            statement_id: statementCompoundAtom.entity.id,
            text: row.basis_statement_compound_atom_statement_text,
            creator_user_id: row.basis_statement_compound_atom_statement_creator_user_id,
            created: row.basis_statement_compound_atom_statement_created,
          })
        }
      }


      if (row.basis_jbc_id) {
        let justificationBasisCompound = justificationBasisCompoundsById[row.basis_jbc_id]
        if (!justificationBasisCompound) {
          justificationBasisCompoundsById[row.basis_jbc_id] = justificationBasisCompound = toJustificationBasisCompound({
            justification_basis_compound_id: row.basis_jbc_id
          })
        }

        let atomsById = justificationBasisCompoundAtomsByCompoundId[justificationBasisCompound.id]
        if (!atomsById) {
          justificationBasisCompoundAtomsByCompoundId[justificationBasisCompound.id] = atomsById = {}
        }

        const atomId = row['basis_jbc_atom_id']
        if (!atomsById[atomId]) {
          const atom = toJustificationBasisCompoundAtom({
            justification_basis_compound_atom_id: atomId,
            justification_basis_compound_id:      justificationBasisCompound.id,
            entity_type:                          row['basis_jbc_atom_entity_type'],
            order_position:                       row['basis_jbc_atom_order_position'],

            statement_id:                row['basis_jbc_atom_statement_id'],
            statement_text:              row['basis_jbc_atom_statement_text'],
            statement_created:           row['basis_jbc_atom_statement_created'],
            statement_creator_user_id:   row['basis_jbc_atom_statement_creator_user_id'],
            source_excerpt_paraphrase_id:                          row['basis_jbc_atom_sep_id'],
            source_excerpt_paraphrasing_statement_id:              row['basis_jbc_atom_sep_paraphrasing_statement_id'],
            source_excerpt_paraphrasing_statement_text:            row['basis_jbc_atom_sep_paraphrasing_statement_text'],
            source_excerpt_paraphrasing_statement_created:         row['basis_jbc_atom_sep_paraphrasing_statement_created'],
            source_excerpt_paraphrasing_statement_creator_user_id: row['basis_jbc_atom_sep_paraphrasing_statement_creator_user_id'],
            source_excerpt_type:                            row['basis_jbc_atom_sep_source_excerpt_type'],
            source_excerpt_writ_quote_id:                   row['basis_jbc_atom_sep_writ_quote_id'],
            source_excerpt_writ_quote_quote_text:           row['basis_jbc_atom_sep_writ_quote_quote_text'],
            source_excerpt_writ_quote_created:              row['basis_jbc_atom_sep_writ_quote_created'],
            source_excerpt_writ_quote_creator_user_id:      row['basis_jbc_atom_sep_writ_quote_creator_user_id'],
            source_excerpt_writ_quote_writ_id:              row['basis_jbc_atom_sep_writ_quote_writ_id'],
            source_excerpt_writ_quote_writ_title:           row['basis_jbc_atom_sep_writ_quote_writ_title'],
            source_excerpt_writ_quote_writ_created:         row['basis_jbc_atom_sep_writ_quote_writ_created'],
            source_excerpt_writ_quote_writ_creator_user_id: row['basis_jbc_atom_sep_writ_quote_writ_creator_user_id'],
          })

          atomsById[atomId] = atom
        }
      }

      if (row.basis_writ_quote_id) {
        let writQuote = writQuotesById[row.basis_writ_quote_id]
        if (!writQuote) {
          writQuotesById[row.basis_writ_quote_id] = writQuote = toWritQuote({
            writ_quote_id: row.basis_writ_quote_id,
            writ_id: row.basis_writ_quote_writ_id,
            quote_text: row.basis_writ_quote_quote_text,
            created: row.basis_writ_quote_created,
            creator_user_id: row.basis_writ_quote_creator_user_id,
          })
        }

        const writ = writsById[writQuote.writ.id]
        if (!writ) {
          writsById[row.basis_writ_quote_writ_id] = toWrit({
            writ_id: row.basis_writ_quote_writ_id,
            title: row.basis_writ_quote_writ_title,
            created: row.basis_writ_quote_writ_created,
            creator_user_id: row.basis_writ_quote_writ_creator_user_id,
          })
        }

        if (row.basis_writ_quote_url_id) {
          let url = urlsById[row.basis_writ_quote_url_id]
          if (!url) {
            urlsById[row.basis_writ_quote_url_id] = url = toUrl({
              url_id: row.basis_writ_quote_url_id,
              url: row.basis_writ_quote_url_url
            })
          }
          let urls = urlsByWritQuoteId[writQuote.id]
          if (!urls) {
            urlsByWritQuoteId[writQuote.id] = urls = []
          }
          urls.push(url)
        }
      }
    })

    return {
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByCompoundId,
      justificationBasisCompoundsById,
      justificationBasisCompoundAtomsByCompoundId,
      statementsById,
      writQuotesById,
      writsById,
      urlsByWritQuoteId,
    }
  }

  _connectEverything(
    perspectivesById,
    justificationsById,
    statementCompoundsById,
    statementCompoundAtomsByCompoundId,
    justificationBasisCompoundsById,
    justificationBasisCompoundAtomsByCompoundId,
    statementsById,
    writQuotesById,
    writsById,
    urlsByWritQuoteId
  ) {
    forEach(perspectivesById, p => {
      p.statement = statementsById[p.statement.id]
    })

    forEach(justificationsById, j => {

      j.rootStatement = statementsById[j.rootStatement.id]

      switch (j.target.type) {
        case JustificationTargetType.STATEMENT: {
          const targetStatement = statementsById[j.target.entity.id]
          j.target.entity = targetStatement
          if (!targetStatement.justifications) {
            targetStatement.justifications = []
          }
          targetStatement.justifications.push(j)
        }
          break
        case JustificationTargetType.JUSTIFICATION: {
          const targetJustification = justificationsById[j.target.entity.id]
          j.target.entity = targetJustification
          targetJustification.counterJustifications.push(j)
        }
          break
        default:
          throw newImpossibleError(`justification ${j.id} has unsupported target type ${j.target.type}`)
      }

      switch (j.basis.type) {
        case JustificationBasisType.STATEMENT_COMPOUND: {
          j.basis.entity = statementCompoundsById[j.basis.entity.id]
          break
        }
        case JustificationBasisType.WRIT_QUOTE: {
          j.basis.entity = writQuotesById[j.basis.entity.id]
          break
        }
        case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND: {
          j.basis.entity = justificationBasisCompoundsById[j.basis.entity.id]
          break
        }
        default:
          throw newExhaustedEnumError('JustificationBasisType', j.basis.type, `justification ${j.id} has unsupported basis type ${j.basis.type}`)
      }

      assert(isTruthy(j.basis.entity))
    })

    forEach(statementCompoundsById, (sc) => {
      sc.atoms = statementCompoundAtomsByCompoundId[sc.id]
    })
    forEach(statementCompoundAtomsByCompoundId, scas =>
      forEach(scas, (sca) => {
        sca.entity = statementsById[sca.entity.id]
      })
    )

    forEach(justificationBasisCompoundsById, (jbc) => {
      jbc.atoms = values(justificationBasisCompoundAtomsByCompoundId[jbc.id])
    })

    forEach(writQuotesById, (wq) => {
      wq.writ = writsById[wq.writ.id]
      wq.urls = urlsByWritQuoteId[wq.id]
    })
  }
}
