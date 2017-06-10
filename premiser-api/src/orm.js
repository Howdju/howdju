const {JustificationBasisType} = require('./models')

const toSlug = text => text && text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()

const toStatement = row => !row ? row : ({
  id: row.statement_id,
  text: row.text,
  slug: toSlug(row.text)
})

const toJustification = (row, urlsByJustificationId, counterJustificationsByJustificationId) => {
  if (!row) {
    return row
  }

  let justification = {
    id: row.justification_id,
    rootStatementId: row.root_statement_id,
    target: {
      type: row.target_type,
      entity: {
        id: row.target_id
      }
    },
    basis: {
      type: row.basis_type,
      entity: {
        id: row.basis_id
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
  id: row.citation_reference_id,
  quote: row.quote,
  citation: toCitation({
    citation_id: row.citation_reference_citation_id,
    text: row.citation_reference_citation_text
  })
}

const toCitation = row => !row ? row : ({
  id: row.citation_id,
  text: row.text
})

const toUrl = row => !row ? row : ({
  id: row.url_id,
  url: row.url
})

const toVote = row => {
  return {
    id: row.vote_id,
    polarity: row.polarity,
    targetType: row.target_type,
    targetId: row.target_id,
  }
}

module.exports = {
  toStatement,
  toJustification,
  toCitationReference,
  toCitation,
  toUrl,
  toVote,
}