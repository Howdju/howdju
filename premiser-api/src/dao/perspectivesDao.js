const Promise = require('bluebird')
const forEach = require('lodash/forEach')
const join = require('lodash/join')
const map = require('lodash/map')
const range = require('lodash/range')

const {
  VoteTargetType,
  JustificationBasisType,
  JustificationTargetType,
  newImpossibleError,
} = require('howdju-common')

const {
  toPerspective,
  toJustification,
  toStatementCompound,
  toStatement,
  toStatementCompoundAtom,
  toUrl,
  toCitation,
  toCitationReference,
} = require('../orm')
const {query} = require('../db')


class PerspectivesDao {
  /** All justifications must be included in the perspective.
   *
   * See <premiser-processing>/src/perspectiveService for a more complicated approach of inferring included justifications
   * across root statement boundaries, but that has the added difficulties of multiple paths from perspective-justification
   * to perspective-statement.
   */
  readFeaturedPerspectivesWithVotesForOptionalUserId(userId) {
    const args = [
        JustificationBasisType.STATEMENT_COMPOUND,
        JustificationBasisType.CITATION_REFERENCE
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
              v.target_type = $3
          and j.justification_id = v.target_id
          and v.user_id = $4
          and v.deleted IS NULL
        ` :
        ''
    const perspectiveJustificationsSql = `
      select 
          p.perspective_id
        , p.creator_user_id as perspective_creator_user_id
        , p.statement_id as perspective_statement_id
        , ps.text as perspective_statement_text
        , ps.creator_user_id as perspective_statement_creator_user_id
        , ps.created as perspective_statement_created
        , j.*
        , sc.statement_compound_id as basis_statement_compound_id
        , sca.statement_id as basis_statement_compound_atom_statement_id
        , sca.order_position as basis_statement_compound_atom_order_position
        , scas.text as basis_statement_compound_atom_statement_text
        , scas.created as basis_statement_compound_atom_statement_created
        , scas.creator_user_id as basis_statement_compound_atom_statement_creator_user_id
        , cr.citation_reference_id as basis_citation_reference_id
        , cr.quote as basis_citation_reference_quote
        , c.citation_id as basis_citation_reference_citation_id
        , c.text as basis_citation_reference_citation_text
        , cru.url_id as basis_citation_reference_url_id
        , u.url as basis_citation_reference_url_url
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
          
        left join citation_references cr on
              j.basis_type = $2
          and j.basis_id = cr.citation_reference_id
          and cr.deleted is null
        left join citations c on
              cr.citation_id = c.citation_id
          and c.deleted is null
        left join citation_reference_urls cru on
             cr.citation_reference_id = cru.citation_reference_id
         and cru.deleted is null
        left join urls u on
              cru.url_id = u.url_id
          and u.deleted is null
        ${votesJoinSql}
        order by sca.order_position
    `
    return query(perspectiveJustificationsSql, args)
        .then( ({rows}) => this._postProcessRows(rows))
  }

  _postProcessRows(rows) {
    const {
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      citationReferencesById,
      citationsById,
      urlsByCitationReferenceId,
    } = this._indexRows(rows)

    this._connectEverything(
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      citationReferencesById,
      citationsById,
      urlsByCitationReferenceId
    )

    return map(perspectivesById, p => p)
  }

  _indexRows(rows) {
    const perspectivesById = {}
    const justificationsById = {}
    const statementCompoundsById = {}
    const statementCompoundAtomsByStatementCompoundId = {}
    const statementsById = {}
    const citationReferencesById = {}
    const citationsById = {}
    const urlsById = {}
    const urlsByCitationReferenceId = {}

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

        let statementCompoundAtoms = statementCompoundAtomsByStatementCompoundId[statementCompound.id]
        if (!statementCompoundAtoms) {
          statementCompoundAtomsByStatementCompoundId[statementCompound.id] = statementCompoundAtoms = []
        }
        const statementCompoundAtom = toStatementCompoundAtom({
          statement_compound_id: statementCompound.id,
          statement_id: row.basis_statement_compound_atom_statement_id,
          order_position: row.basis_statement_compound_atom_order_position,
        })
        statementCompoundAtoms.push(statementCompoundAtom)

        const statement = statementsById[statementCompoundAtom.statement.id]
        if (!statement) {
          statementsById[statementCompoundAtom.statement.id] = toStatement({
            statement_id: statementCompoundAtom.statement.id,
            text: row.basis_statement_compound_atom_statement_text,
            creator_user_id: row.basis_statement_compound_atom_statement_creator_user_id,
            created: row.basis_statement_compound_atom_statement_created,
          })
        }
      }

      if (row.basis_citation_reference_id) {
        let citationReference = citationReferencesById[row.basis_citation_reference_id]
        if (!citationReference) {
          citationReferencesById[row.basis_citation_reference_id] = citationReference = toCitationReference({
            citation_reference_id: row.basis_citation_reference_id,
            citation_id: row.basis_citation_reference_citation_id,
            quote: row.basis_citation_reference_quote
          })
        }

        const citation = citationsById[citationReference.citation.id]
        if (!citation) {
          citationsById[row.basis_citation_reference_citation_id] = toCitation({
            citation_id: row.basis_citation_reference_citation_id,
            text: row.basis_citation_reference_citation_text
          })
        }

        if (row.basis_citation_reference_url_id) {
          let url = urlsById[row.basis_citation_reference_url_id]
          if (!url) {
            urlsById[row.basis_citation_reference_url_id] = url = toUrl({
              url_id: row.basis_citation_reference_url_id,
              url: row.basis_citation_reference_url_url
            })
          }
          let urls = urlsByCitationReferenceId[citationReference.id]
          if (!urls) {
            urlsByCitationReferenceId[citationReference.id] = urls = []
          }
          urls.push(url)
        }
      }
    })

    return {
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      citationReferencesById,
      citationsById,
      urlsByCitationReferenceId,
    }
  }

  _connectEverything(
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      citationReferencesById,
      citationsById,
      urlsByCitationReferenceId
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
        }
          break
        case JustificationBasisType.CITATION_REFERENCE: {
          j.basis.entity = citationReferencesById[j.basis.entity.id]
        }
          break
        default:
          throw newImpossibleError(`justification ${j.id} has unsupported basis type ${j.target.type}`)
      }
    })

    forEach(statementCompoundsById, sc => {
      sc.atoms = statementCompoundAtomsByStatementCompoundId[sc.id]
    })

    forEach(statementCompoundAtomsByStatementCompoundId, scas =>
      forEach(scas, sca => {
        sca.statement = statementsById[sca.statement.id]
      })
    )

    forEach(citationReferencesById, cr => {
      cr.citation = citationsById[cr.citation.id]
      cr.urls = urlsByCitationReferenceId[cr.id]
    })
  }
}

module.exports = new PerspectivesDao()