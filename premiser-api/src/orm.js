const isArray = require('lodash/isArray')
const map = require('lodash/map')
const sortBy = require('lodash/sortBy')
const toString = require('lodash/toString')
const values = require('lodash/values')

const {JustificationBasisType} = require('./models')
const {ImpossibleError} = require('./errors')

const toUser = row => !row ? row : ({
  id: toString(row.user_id),
  email: row.email,
  shortName: row.short_name,
  fullName: row.full_name,
  created: row.created,
  externalIds: {
    googleAnalyticsId: row.google_analytics_id,
    heapAnalyticsId: row.heap_analytics_id,
    mixpanelId: row.mixpanel_id,
    sentryId: row.sentry_id,
    smallchatId: row.smallchat_id,
  }
})

const toSlug = text => text && text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()

const toStatement = row => !row ? row : ({
  id: toString(row.statement_id),
  text: row.text,
  slug: toSlug(row.text),
  creatorUserId: toString(row.creator_user_id),
  created: row.created,
  justifications: null,
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
    rootPolarity: row.root_polarity,
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
    }),
    counterJustifications: [],
  }

  switch (row.basis_type) {
    case JustificationBasisType.CITATION_REFERENCE: {
        const basisId = row.basis_id || row.basis_citation_reference_id
        if (basisId) {
          if (citationReferencesById) {
            justification.basis.entity = citationReferencesById[basisId]
          }
          if (!justification.basis.entity && row.basis_citation_reference_id) {
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
        const basisId = row.basis_id || row.basis_statement_compound_id
        if (basisId) {
          if (statementCompoundsById) {
            justification.basis.entity = statementCompoundsById[basisId]
          }
          if (!justification.basis.entity && row.basis_statement_compound_id) {
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
      throw new ImpossibleError(`Unsupported JustificationBasisType: ${row.basis_type}`)
  }

  if (!justification.basis.entity) {
    justification.basis.entity = {id: row.basis_id}
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
  created: row.created,
  citation: toCitation({
    citation_id: row.citation_id,
    text: row.citation_text,
    created: row.citation_created,
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
    if (!isArray(atoms)) {
      // Assume a non-array is an object of atoms by statementId
      atoms = values(atoms)
      atoms = sortBy(atoms, a => a.orderPosition)
    }
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

const toPerspective = row => !row ? row : ({
  id: row.perspective_id,
  statement: {id: row.statement_id},
  creatorUserId: row.creator_user_id,
})

const toUserHash = row => !row ? row : ({
  userId: row.user_id,
  hash: row.hash,
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
  toPerspective,
  toUserHash,
}