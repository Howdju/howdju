const isArray = require('lodash/isArray')
const map = require('lodash/map')
const sortBy = require('lodash/sortBy')
const toString = require('lodash/toString')
const values = require('lodash/values')

const {
  JustificationBasisType,
  newImpossibleError,
  StatementCompoundAtomType,
} = require('howdju-common')

const toUser = row => row && ({
  id: toString(row.user_id),
  email: row.email,
  shortName: row.short_name,
  longName: row.long_name,
  created: row.created,
  isActive: row.is_active,
  externalIds: toUserExternalIds(row),
})

const toUserExternalIds = row => row && ({
  googleAnalyticsId: row.google_analytics_id,
  heapAnalyticsId: row.heap_analytics_id,
  mixpanelId: row.mixpanel_id,
  sentryId: row.sentry_id,
  smallchatId: row.smallchat_id,
})

const toSlug = text => text && text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()

const toStatement = row => row && ({
  id: toString(row.statement_id),
  text: row.text,
  normalText: row.normal_text,
  slug: toSlug(row.text),
  creatorUserId: toString(row.creator_user_id),
  created: row.created,
  justifications: null,
})

const toJustification = (
  row,
  counterJustificationsByJustificationId,
  statementCompoundsById,
  writQuotesById,
  justificationBasisCompoundsById
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
    case JustificationBasisType.WRIT_QUOTE: {
      const basisId = row.basis_id || row.basis_writ_quote_id
      if (basisId) {
        if (writQuotesById) {
          justification.basis.entity = writQuotesById[basisId]
        }
        if (!justification.basis.entity && row.basis_writ_quote_id) {
          justification.basis.entity = toWritQuote({
            writ_quote_id: row.basis_writ_quote_id,
            quote_text: row.basis_writ_quote_quote_text,
            writ_id: row.basis_writ_quote_writ_id,
            writ_title: row.basis_writ_quote_writ_title,
          })
        }
      }
      break
    }

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
      break
    }

    case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND: {
      const basisId = row.basis_id || row.basis_justification_basis_compound_id
      if (basisId) {
        if (justificationBasisCompoundsById) {
          justification.basis.entity = justificationBasisCompoundsById[basisId]
        }
        if (!justification.basis.entity && row.basis_justification_basis_compound_id) {
          justification.basis.entity = toJustificationBasisCompound({
            justification_basis_compound_id: row.basis_justification_basis_compound_id,
            created: row.basis_justification_basis_compound_created,
            creator_user_id: row.basis_justification_basis_compound_creator_user_id,
          })
        }
      }
      break
    }

    default:
      throw newImpossibleError(`Unsupported JustificationBasisType: ${row.basis_type}`)
  }

  if (!justification.basis.entity) {
    justification.basis.entity = {id: row.basis_id}
  }

  if (counterJustificationsByJustificationId) {
    const counterJustifications = counterJustificationsByJustificationId[justification.id]
    if (counterJustifications) {
      justification.counterJustifications = map(counterJustifications, j =>
        toJustification(j, counterJustificationsByJustificationId, statementCompoundsById, writQuotesById))
    }
  }

  return justification
}

const toWritQuote = row => row && {
  id: toString(row.writ_quote_id),
  quoteText: row.quote_text,
  created: row.created,
  writ: toWrit({
    writ_id: row.writ_id,
    title: row.writ_title,
    created: row.writ_created,
  })
}

const toWrit = row => {
  const writ = row && ({
    id: toString(row.writ_id),
    title: row.title,
    created: row.created,
  })
  return writ
}
const toUrl = row => row && ({
  id: toString(row.url_id),
  url: row.url
})

const toVote = row => row && ({
  id: toString(row.vote_id),
  polarity: row.polarity,
  targetType: row.target_type,
  targetId: row.target_id,
  created: row.created,
  deleted: row.deleted,
})

const toWritQuoteUrl = row => row && ({
  writQuoteId: toString(row.writ_quote_id),
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

const toStatementCompoundAtom = row => row && ({
  compoundId: row.statement_compound_id,
  type: StatementCompoundAtomType.STATEMENT,
  entity: toStatement({
    statement_id: row.statement_id,
    text: row.statement_text,
    creator_user_id: row.statement_creator_user_id,
    created: row.statement_created,
  }),
  orderPosition: row.order_position,
})

const toPerspective = row => row && ({
  id: row.perspective_id,
  statement: {id: row.statement_id},
  creatorUserId: row.creator_user_id,
})

const toUserHash = row => row && ({
  userId: row.user_id,
  hash: row.hash,
})

const toJobHistory = row => row && ({
  id: row.job_history_id,
  type: row.job_type,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  wasSuccess: row.was_success,
  message: row.message,
})

const toJustificationScore = row => row && ({
  justificationId: row.justification_id,
  scoreType: row.score_type,
  score: row.score,
  created: row.created,
  deleted: row.deleted,
  creatorJobHistoryId: row.creator_job_history_id,
  deleotrJobHistoryId: row.deletor_job_history_id,
})

const toSourceExcerptParaphrase = row => row & ({
  id: row.source_excerpt_paraphrase_id,
  paraphrasingStatement: {
    id: row.paraphrasing_statement_id,
  },
  sourceExcerpt: {
    type: row.entity_type,
    id: row.entity_id,
  },
})

const toJustificationBasisCompound = row => row && ({
  id: row.justification_basis_compound_id,
  atoms: [],
  creatorUserId: row.creator_user_id,
  created: row.created,
})

const toJustificationBasisCompoundAtom = row => row && ({
  id: row.justification_basis_compound_atom_id,
  compoundId: row.justification_basis_compound_id,
  type: row.entity_type,
  entity: {
    id: row.entity_id,
  },
})

module.exports = {
  toUser,
  toStatement,
  toJustification,
  toWritQuote,
  toWrit,
  toUrl,
  toVote,
  toWritQuoteUrl,
  toStatementCompound,
  toStatementCompoundAtom,
  toPerspective,
  toUserHash,
  toUserExternalIds,
  toJobHistory,
  toJustificationScore,
  toSourceExcerptParaphrase,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
}