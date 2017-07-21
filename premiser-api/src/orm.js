const toString = require('lodash/toString')
const map = require('lodash/map')

const {JustificationBasisType} = require('./models')
const {ImpossibleError} = require('./errors')

const toUser = row => !row ? row : ({
  id: toString(row.user_id),
  email: row.email,
  hash: row.hash,
})

const toSlug = text => text && text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()

const toStatement = row => !row ? row : ({
  id: toString(row.statement_id),
  text: row.text,
  slug: toSlug(row.text),
  creatorUserId: toString(row.creator_user_id),
  created: row.created,
})

const toJustification = (
    row,
    counterJustificationsByJustificationId,
    statementCompoundsById,
    citationReferencesById
) => {
  if (!row) {
    return row
  }

  const justification = {
    id: toString(row.justification_id),
    creatorUserId: toString(row.creator_user_id),
    created: row.created,
    rootStatement: toStatement({
      statement_id: row.root_statement_id,
      text: row.root_statement_text,
      created: row.root_statement_created,
      creator_user_id: row.root_statement_creator_user_id,
    }),
    target: {
      type: row.target_type,
      entity: {
        id: toString(row.target_id)
      }
    },
    basis: {
      type: row.basis_type,
      entity: {
        id: toString(row.basis_id)
      }
    },
    polarity: row.polarity,
    score: row.score,
    vote: row.vote_id && toVote({
      vote_id: row.vote_id,
      polarity: row.vote_polarity,
      target_type: row.vote_target_type,
      target_id: row.vote_target_id,
    })
  }

  switch (row.basis_type) {
    case JustificationBasisType.CITATION_REFERENCE: {
        if (row.basis_id) {
          if (citationReferencesById) {
            justification.basis.entity = citationReferencesById[row.basis_id]
          } else if (row.basis_citation_reference_id) {
            justification.basis.entity = toCitationReference({
              citation_reference_id: row.basis_citation_reference_id,
              quote: row.basis_citation_reference_quote,
              citation_id: row.basis_citation_reference_citation_id,
              citation_text: row.basis_citation_reference_citation_text,
            })
          }
        }
      }
      break

    case JustificationBasisType.STATEMENT_COMPOUND: {
        if (row.basis_id) {
          if (statementCompoundsById) {
            justification.basis.entity = statementCompoundsById[row.basis_id]
          } else if (row.basis_statement_compound_id) {
            justification.basis.entity = toStatementCompound({
              statement_compound_id: row.basis_statement_compound_id,
              created: row.basis_statement_compound_created,
              creator_user_id: row.basis_statement_compound_creator_user_id,
            })
          }
        }
      }
      break

    default:
      throw ImpossibleError(`Unsupported JustificationBasisType: ${row.basis_type}`)
  }

  if (counterJustificationsByJustificationId) {
    const counterJustifications = counterJustificationsByJustificationId[justification.id]
    if (counterJustifications) {
      justification.counterJustifications = map(counterJustifications, j =>
          toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, citationReferencesById))
    }
  }

  return justification
}

const toCitationReference = row => !row ? row : {
  id: toString(row.citation_reference_id),
  quote: row.quote,
  citation: toCitation({
    citation_id: row.citation_id,
    text: row.citation_text
  })
}

const toCitation = row => {
  const citation = !row ? row : ({
    id: toString(row.citation_id),
    text: row.text,
    created: row.created,
  })
  return citation
}
const toUrl = row => !row ? row : ({
  id: toString(row.url_id),
  url: row.url
})

const toVote = row => {
  return {
    id: toString(row.vote_id),
    polarity: row.polarity,
    targetType: row.target_type,
    targetId: row.target_id,
  }
}

const toCitationReferenceUrl = row => !row ? row : ({
  citationReferenceId: toString(row.citation_reference_id),
  urlId: toString(row.url_id),
})

const toStatementCompound = (row, atoms) => {
  const statementCompound = {
    id: row.statement_compound_id,
    created: row.created,
    creator_user_id: row.creator_user_id,
  }

  if (atoms) {
    statementCompound.atoms = atoms
  }

  return statementCompound
}

const toStatementCompoundAtom = row => !row ? row : ({
  statementCompoundId: row.statement_compound_id,
  statement: toStatement({
    statement_id: row.statement_id,
    text: row.statement_text,
    creator_user_id: row.statement_creator_user_id,
    created: row.statement_created,
  }),
  orderPosition: row.order_position,
})

module.exports = {
  toUser,
  toStatement,
  toJustification,
  toCitationReference,
  toCitation,
  toUrl,
  toVote,
  toCitationReferenceUrl,
  toStatementCompound,
  toStatementCompoundAtom,
}