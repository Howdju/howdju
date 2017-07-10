const toString = require('lodash/toString')
const map = require('lodash/map')

const {JustificationBasisType} = require('./models')

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
    rootStatementId: toString(row.root_statement_id),
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
    case JustificationBasisType.CITATION_REFERENCE:
      if (row.basis_citation_reference_id) {
        justification.basis.entity = citationReferencesById[row.basis_citation_reference_id]
      }
      break

    case JustificationBasisType.STATEMENT_COMPOUND:
      if (row.basis_statement_compound_id) {
        justification.basis.entity = statementCompoundsById[row.basis_statement_compound_id]
      }
      break

    default:
      throw ImpossibleError(`Unsupported JustificationBasisType: ${row.basis_type}`)
  }

  if (counterJustificationsByJustificationId) {
    const counterJustifications = counterJustificationsByJustificationId[justification.id]
    if (counterJustifications) {
      justification.counterJustifications = counterJustifications.map(j =>
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
    text: row.text
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