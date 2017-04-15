
const toSlug = (t) => t.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()

const toStatement = s => !s ? s : ({
  id: s.statement_id,
  text: s.text,
  slug: toSlug(s.text)
})

const toUrl = u => !u ? u : ({
  id: u.url_id,
  url: u.url
})

const toJustification = (j, urlsByJustificationId, counterJustificationsByJustificationId) => {
  if (!j) {
    return j
  }

  let justification = {
    id: j.justification_id,
    target: {
      type: j.target_type,
      entity: {
        id: j.target_id
      }
    },
    basis: {
      type: j.basis_type,
      entity: {
        id: j.basis_id
      }
    },
    polarity: j.polarity,
    score: j.score,
  }

  if (j.basis_statement_text) {
    justification.basis.entity.text = j.basis_statement_text
  }

  if (j.basis_reference_quote) {
    justification.basis.entity.quote = j.basis_reference_quote
  }

  if (j.basis_reference_citation_id) {
    justification.basis.entity.citation = {
      id: j.basis_reference_citation_id,
      text: j.basis_reference_citation_text
    }
  }

  const urls = urlsByJustificationId[justification.id]
  if (urls) {
    justification.basis.entity.urls = urls.map(toUrl)
  }
  const counterJustifications = counterJustificationsByJustificationId[justification.id]
  if (counterJustifications) {
    justification.counterJustifications = counterJustifications.map(j => toJustification(j, urlsByJustificationId, counterJustificationsByJustificationId))
  }

  return justification
}

module.exports = {
  toStatement,
  toJustification,
}