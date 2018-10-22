const forEach = require('lodash/forEach')
const values = require('lodash/values')

const {
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
  toPropositionCompound,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toProposition,
  toPropositionCompoundAtom,
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
   * across root proposition boundaries, but that has the added difficulties of multiple paths from perspective-justification
   * to perspective-proposition.
   */
  readFeaturedPerspectivesWithVotes({userId}) {
    const args = [
      JustificationBasisType.PROPOSITION_COMPOUND,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.PROPOSITION,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptType.WRIT_QUOTE,
    ]
    if (userId) {
      args.push(userId)
    }

    const votesSelectSql = userId ? `
        , v.justification_vote_id
        , v.polarity AS vote_polarity
        , v.justification_id AS vote_justification_id
        ` :
      ''
    const votesJoinSql = userId ? `
        left join justification_votes v on 
              j.justification_id = v.justification_id
          and v.user_id = $7
          and v.deleted IS NULL
        ` :
      ''
    const perspectiveJustificationsSql = `
      select 
          p.perspective_id
        , p.creator_user_id         as perspective_creator_user_id
        , p.proposition_id            as perspective_proposition_id
        , ps.text                   as perspective_proposition_text
        , ps.creator_user_id        as perspective_proposition_creator_user_id
        , ps.created                as perspective_proposition_created
        , j.*
        , sc.proposition_compound_id  as basis_proposition_compound_id
        , sca.proposition_id          as basis_proposition_compound_atom_proposition_id
        , sca.order_position        as basis_proposition_compound_atom_order_position
        , scas.text                 as basis_proposition_compound_atom_proposition_text
        , scas.created              as basis_proposition_compound_atom_proposition_created
        , scas.creator_user_id      as basis_proposition_compound_atom_proposition_creator_user_id
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
        
        ${votesSelectSql}
      from perspectives p 
        join propositions ps on 
              p.is_featured
          and p.proposition_id = ps.proposition_id
          and p.deleted is null
          and ps.deleted is null
        join perspective_justifications pj on
              p.perspective_id = pj.perspective_id
        join justifications j on
              j.deleted is null
          and pj.justification_id = j.justification_id
          
        left join proposition_compounds sc on
              j.basis_type = $1
          and j.basis_id = sc.proposition_compound_id
          and sc.deleted is null
        left join proposition_compound_atoms sca on
              sc.proposition_compound_id = sca.proposition_compound_id
        left join propositions scas on
              sca.proposition_id = scas.proposition_id
          and scas.deleted is null
          
        left join justification_basis_compounds jbc on
              j.basis_type = $3
          and j.basis_id = jbc.justification_basis_compound_id
        left join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
        left join propositions jbcas on
              jbca.entity_type = $4
          and jbca.entity_id = jbcas.proposition_id
        left join source_excerpt_paraphrases sep on
              jbca.entity_type = $5
          and jbca.entity_id = sep.source_excerpt_paraphrase_id
        left join propositions sep_s on
              sep.paraphrasing_proposition_id = sep_s.proposition_id
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
      propositionCompoundsById,
      propositionCompoundAtomsByCompoundId,
      justificationBasisCompoundsById,
      justificationBasisCompoundAtomsByCompoundId,
      propositionsById,
      writQuotesById,
      writsById,
      urlsByWritQuoteId,
    } = this._indexRows(rows)

    this._connectEverything(
      perspectivesById,
      justificationsById,
      propositionCompoundsById,
      propositionCompoundAtomsByCompoundId,
      justificationBasisCompoundsById,
      justificationBasisCompoundAtomsByCompoundId,
      propositionsById,
      writQuotesById,
      writsById,
      urlsByWritQuoteId
    )

    return values(perspectivesById)
  }

  _indexRows(rows) {
    const perspectivesById = {}
    const justificationsById = {}
    const propositionCompoundsById = {}
    const propositionCompoundAtomsByCompoundId = {}
    const justificationBasisCompoundsById = {}
    const justificationBasisCompoundAtomsByCompoundId = {}
    const propositionsById = {}
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
          proposition_id: row.perspective_proposition_id,
        })
      }
      let perspectiveProposition = propositionsById[perspective.proposition.id]
      if (!perspectiveProposition) {
        propositionsById[perspective.proposition.id] = toProposition({
          proposition_id: row.perspective_proposition_id,
          text: row.perspective_proposition_text,
          creator_user_id: row.perspective_proposition_creator_user_id,
          created: row.perspectivce_proposition_created,
        })
      }

      const justification = justificationsById[row.justification_id]
      if (!justification) {
        justificationsById[row.justification_id] = toJustification(row)
      }

      if (row.basis_proposition_compound_id) {
        let propositionCompound = propositionCompoundsById[row.basis_proposition_compound_id]
        if (!propositionCompound) {
          propositionCompoundsById[row.basis_proposition_compound_id] = propositionCompound = toPropositionCompound({
            proposition_compound_id: row.basis_proposition_compound_id
          })
        }

        let propositionCompoundAtoms = propositionCompoundAtomsByCompoundId[propositionCompound.id]
        if (!propositionCompoundAtoms) {
          propositionCompoundAtomsByCompoundId[propositionCompound.id] = propositionCompoundAtoms = []
        }
        const propositionCompoundAtom = toPropositionCompoundAtom({
          proposition_compound_id: propositionCompound.id,
          proposition_id: row.basis_proposition_compound_atom_proposition_id,
          order_position: row.basis_proposition_compound_atom_order_position,
        })
        propositionCompoundAtoms.push(propositionCompoundAtom)

        const proposition = propositionsById[propositionCompoundAtom.entity.id]
        if (!proposition) {
          propositionsById[propositionCompoundAtom.entity.id] = toProposition({
            proposition_id: propositionCompoundAtom.entity.id,
            text: row.basis_proposition_compound_atom_proposition_text,
            creator_user_id: row.basis_proposition_compound_atom_proposition_creator_user_id,
            created: row.basis_proposition_compound_atom_proposition_created,
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

            proposition_id:                row['basis_jbc_atom_proposition_id'],
            proposition_text:              row['basis_jbc_atom_proposition_text'],
            proposition_created:           row['basis_jbc_atom_proposition_created'],
            proposition_creator_user_id:   row['basis_jbc_atom_proposition_creator_user_id'],
            source_excerpt_paraphrase_id:                          row['basis_jbc_atom_sep_id'],
            source_excerpt_paraphrasing_proposition_id:              row['basis_jbc_atom_sep_paraphrasing_proposition_id'],
            source_excerpt_paraphrasing_proposition_text:            row['basis_jbc_atom_sep_paraphrasing_proposition_text'],
            source_excerpt_paraphrasing_proposition_created:         row['basis_jbc_atom_sep_paraphrasing_proposition_created'],
            source_excerpt_paraphrasing_proposition_creator_user_id: row['basis_jbc_atom_sep_paraphrasing_proposition_creator_user_id'],
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
      propositionCompoundsById,
      propositionCompoundAtomsByCompoundId,
      justificationBasisCompoundsById,
      justificationBasisCompoundAtomsByCompoundId,
      propositionsById,
      writQuotesById,
      writsById,
      urlsByWritQuoteId,
    }
  }

  _connectEverything(
    perspectivesById,
    justificationsById,
    propositionCompoundsById,
    propositionCompoundAtomsByCompoundId,
    justificationBasisCompoundsById,
    justificationBasisCompoundAtomsByCompoundId,
    propositionsById,
    writQuotesById,
    writsById,
    urlsByWritQuoteId
  ) {
    forEach(perspectivesById, p => {
      p.proposition = propositionsById[p.proposition.id]
    })

    forEach(justificationsById, j => {

      j.rootProposition = propositionsById[j.rootProposition.id]

      switch (j.target.type) {
        case JustificationTargetType.PROPOSITION: {
          const targetProposition = propositionsById[j.target.entity.id]
          j.target.entity = targetProposition
          if (!targetProposition.justifications) {
            targetProposition.justifications = []
          }
          targetProposition.justifications.push(j)
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
        case JustificationBasisType.PROPOSITION_COMPOUND: {
          j.basis.entity = propositionCompoundsById[j.basis.entity.id]
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

    forEach(propositionCompoundsById, (sc) => {
      sc.atoms = propositionCompoundAtomsByCompoundId[sc.id]
    })
    forEach(propositionCompoundAtomsByCompoundId, scas =>
      forEach(scas, (sca) => {
        sca.entity = propositionsById[sca.entity.id]
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
