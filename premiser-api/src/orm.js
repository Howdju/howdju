const toString = require('lodash/toString')

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
  slug: toSlug(row.text)
})

const toJustification = (row, urlsByJustificationId, counterJustificationsByJustificationId) => {
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
        justification.basis.entity = toCitationReference({
          citation_reference_id: row.basis_citation_reference_id,
          quote: row.basis_citation_reference_quote,
          citation_reference_citation_id: row.basis_citation_reference_citation_id,
          citation_reference_citation_text: row.basis_citation_reference_citation_text,
        })
      }
      break

    case JustificationBasisType.STATEMENT:
      if (row.basis_statement_id) {
        justification.basis.entity = toStatement({
          statement_id: row.basis_statement_id,
          text: row.basis_statement_text,
        })
      }
      break

    default:
      throw Error(`Unsupported JustificationBasisType: ${row.basis_type}`)
  }

  if (urlsByJustificationId) {
    const urls = urlsByJustificationId[justification.id] || []
    justification.basis.entity.urls = urls.map(toUrl)
  }

  if (counterJustificationsByJustificationId) {
    const counterJustifications = counterJustificationsByJustificationId[justification.id]
    if (counterJustifications) {
      justification.counterJustifications = counterJustifications.map(j => toJustification(j, urlsByJustificationId, counterJustificationsByJustificationId))
    }
  }

  return justification
}

const toCitationReference = row => !row ? row : {
  id: toString(row.citation_reference_id),
  quote: row.quote,
  citation: toCitation({
    citation_id: row.citation_reference_citation_id,
    text: row.citation_reference_citation_text
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

module.exports = {
  toUser,
  toStatement,
  toJustification,
  toCitationReference,
  toCitation,
  toUrl,
  toVote,
  toCitationReferenceUrl,
}