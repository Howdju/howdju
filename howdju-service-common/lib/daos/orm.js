const isArray = require('lodash/isArray')
const map = require('lodash/map')
const merge = require('lodash/merge')
const sortBy = require('lodash/sortBy')
const toString = require('lodash/toString')
const values = require('lodash/values')

const {
  JustificationBasisType,
  newImpossibleError,
  PropositionCompoundAtomType,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
  newExhaustedEnumError,
  toSlug,
} = require('howdju-common')


const toUser = (row) => {
  if (!row) {
    return row
  }
  const user = merge({
    id: toString(row.user_id),
  }, {
    email: row.email,
    longName: row.long_name,
    shortName: row.short_name,
    created: row.created,
    isActive: row.is_active,
    externalIds: toUserExternalIds(row),
  })

  return user
}

const toUserExternalIds = (row) => row && ({
  googleAnalyticsId: row.google_analytics_id,
  heapAnalyticsId: row.heap_analytics_id,
  mixpanelId: row.mixpanel_id,
  sentryId: row.sentry_id,
  smallchatId: row.smallchat_id,
})

const toProposition = (row) => {
  if (!row) {
    return row
  }
  const proposition = {
    id: toString(row.proposition_id),
    text: row.text,
    normalText: row.normal_text,
    slug: toSlug(row.normal_text),
    created: row.created,
    justifications: null,
  }

  if (row.creator_user_id) {
    proposition.creator = toUser({
      user_id: row.creator_user_id,
      long_name: row.creator_user_long_name,
    })
  }

  return proposition
}

const toJustification = (
  row,
  counterJustificationsByJustificationId,
  propositionCompoundsById,
  writQuotesById,
  justificationBasisCompoundsById
) => {
  if (!row) {
    return row
  }

  const justification = {
    id: toString(row.justification_id),
    created: row.created,
    rootProposition: toProposition({
      proposition_id: row.root_proposition_id,
      text: row.root_proposition_text,
      created: row.root_proposition_created,
      creator_user_id: row.root_proposition_creator_user_id,
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
    vote: row.justification_vote_id && toJustificationVote({
      justification_vote_id: row.justification_vote_id,
      polarity: row.vote_polarity,
      justification_id: row.vote_justification_id,
    }),
    counterJustifications: [],
  }

  if (row.creator_user_id) {
    justification.creator = toUser({
      user_id: row.creator_user_id,
      long_name: row.creator_user_long_name,
    })
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

    case JustificationBasisType.PROPOSITION_COMPOUND: {
      const basisId = row.basis_id || row.basis_proposition_compound_id
      if (basisId) {
        if (propositionCompoundsById) {
          justification.basis.entity = propositionCompoundsById[basisId]
        }
        if (!justification.basis.entity && row.basis_proposition_compound_id) {
          justification.basis.entity = toPropositionCompound({
            proposition_compound_id: row.basis_proposition_compound_id,
            created: row.basis_proposition_compound_created,
            creator_user_id: row.basis_proposition_compound_creator_user_id,
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
        toJustification(j, counterJustificationsByJustificationId, propositionCompoundsById, writQuotesById,
          justificationBasisCompoundsById))
    }
  }

  return justification
}

const toWritQuote = (row) => row && {
  id: toString(row.writ_quote_id),
  quoteText: row.quote_text,
  created: row.created,
  creatorUserId: row.creator_user_id,
  writ: toWrit({
    writ_id: row.writ_id,
    title: row.writ_title,
    created: row.writ_created,
    creatorUserId: row.creator_user_id,
  }),
  urls: [],
}

const toWrit = (row) => {
  const writ = row && ({
    id: toString(row.writ_id),
    title: row.title,
    created: row.created,
  })
  return writ
}
const toUrl = (row) => row && ({
  id: toString(row.url_id),
  url: row.url
})

const toJustificationVote = (row) => row && ({
  id: toString(row.justification_vote_id),
  polarity: row.polarity,
  justificationId: row.justification_id,
  created: row.created,
  deleted: row.deleted,
})

const toWritQuoteUrl = (row) => row && ({
  writQuoteId: toString(row.writ_quote_id),
  urlId: toString(row.url_id),
})

const toPropositionCompound = (row, atoms) => {
  if (!row) {
    return row
  }

  const propositionCompound = {
    id: row.proposition_compound_id,
    created: row.created,
    creator_user_id: row.creator_user_id,
  }

  if (atoms) {
    if (!isArray(atoms)) {
      // Assume a non-array is an object of atoms by propositionId
      atoms = values(atoms)
      atoms = sortBy(atoms, a => a.orderPosition)
    }
    propositionCompound.atoms = atoms
  }

  return propositionCompound
}

const toPropositionCompoundAtom = (row) => row && ({
  compoundId: row.proposition_compound_id,
  type: PropositionCompoundAtomType.PROPOSITION,
  entity: toProposition({
    proposition_id: row.proposition_id,
    text: row.proposition_text,
    creator_user_id: row.proposition_creator_user_id,
    created: row.proposition_created,
  }),
  orderPosition: row.order_position,
})

const toPerspective = (row) => row && ({
  id: row.perspective_id,
  proposition: {id: row.proposition_id},
  creatorUserId: row.creator_user_id,
})

const toUserHash = (row) => row && ({
  userId: row.user_id,
  hash: row.hash,
})

const toJobHistory = (row) => row && ({
  id: row.job_history_id,
  type: row.job_type,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  wasSuccess: row.was_success,
  message: row.message,
})

const toJustificationScore = (row) => row && ({
  justificationId: row.justification_id,
  scoreType: row.score_type,
  score: row.score,
  created: row.created,
  deleted: row.deleted,
  creatorJobHistoryId: row.creator_job_history_id,
  deletorJobHistoryId: row.deletor_job_history_id,
})

const toJustificationBasisCompound = (row, atoms) => {
  if (!row) {
    return row
  }

  const compound = {
    id: row.justification_basis_compound_id,
    atoms: [],
    creatorUserId: row.creator_user_id,
    created: row.created,
  }

  if (atoms) {
    if (!isArray(atoms)) {
      // Assume a non-array is an object of atoms by propositionId
      atoms = values(atoms)
      atoms = sortBy(atoms, a => a.orderPosition)
    }
    compound.atoms = atoms
  }

  return compound
}

const toJustificationBasisCompoundAtom = (row) => {
  if (!row) {
    return row
  }

  const atom = {
    id: row.justification_basis_compound_atom_id,
    compoundId: row.justification_basis_compound_id,
    type: row.entity_type,
    entity: {
      id: row.entity_id,
    },
    orderPosition: row.order_position,
  }

  switch (atom.type) {
    case JustificationBasisCompoundAtomType.PROPOSITION:
      if (row.proposition_id) {
        atom.entity = toProposition({
          proposition_id: row.proposition_id,
          text: row.proposition_text,
          created: row.proposition_created,
          creator_user_id: row.proposition_creator_user_id,
        })
      }
      break
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      if (row.source_excerpt_paraphrase_id) {
        atom.entity = toSourceExcerptParaphrase({
          source_excerpt_paraphrase_id: row.source_excerpt_paraphrase_id,
          paraphrasing_proposition_id: row.source_excerpt_paraphrasing_proposition_id,
          paraphrasing_proposition_text: row.source_excerpt_paraphrasing_proposition_text,
          paraphrasing_proposition_created: row.source_excerpt_paraphrasing_proposition_created,
          paraphrasing_proposition_creator_user_id: row.source_excerpt_paraphrasing_proposition_creator_user_id,
          source_excerpt_type: row.source_excerpt_type,
          writ_quote_id: row.source_excerpt_writ_quote_id,
          writ_quote_quote_text: row.source_excerpt_writ_quote_quote_text,
          writ_quote_created: row.source_excerpt_writ_quote_created,
          writ_quote_creator_user_id: row.source_excerpt_writ_quote_creator_user_id,
          writ_quote_writ_id: row.source_excerpt_writ_quote_writ_id,
          writ_quote_writ_title: row.source_excerpt_writ_quote_writ_title,
          writ_quote_writ_created: row.source_excerpt_writ_quote_writ_created,
          writ_quote_writ_creator_user_id: row.source_excerpt_writ_quote_writ_creator_user_id,
        })
      }
      break
  }

  return atom
}

const toSourceExcerptParaphrase = (row) => {
  if (!row) {
    return row
  }
  const sourceExcerptParaphrase = ({
    id: row.source_excerpt_paraphrase_id,
    paraphrasingProposition: {
      id: row.paraphrasing_proposition_id,
    },
    sourceExcerpt: {
      type: row.source_excerpt_type,
      entity: {
        id: row.source_excerpt_id
      }
    },
  })

  const paraphrasingProposition = toProposition({
    proposition_id: row.paraphrasing_proposition_id,
    text: row.paraphrasing_proposition_text,
    created: row.paraphrasing_proposition_created,
    creator_user_id: row.paraphrasing_proposition_creator_user_id
  })
  if (paraphrasingProposition.id) {
    sourceExcerptParaphrase.paraphrasingProposition = paraphrasingProposition
  }

  const sourceExcerptEntity = toSourceExcerptEntity(row)
  if (sourceExcerptEntity.id) {
    sourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerptEntity
  }

  return sourceExcerptParaphrase
}

const toSourceExcerptEntity = (row) => {
  if (!row) {
    return row
  }

  switch (row.source_excerpt_type) {
    case SourceExcerptType.WRIT_QUOTE:
      return toWritQuote({
        writ_quote_id: row.writ_quote_id,
        quote_text: row.writ_quote_quote_text,
        created: row.writ_quote_created,
        creator_user_id: row.writ_quote_creator_user_id,
        writ_id: row.writ_quote_writ_id,
        writ_title: row.writ_quote_writ_title,
        writ_created: row.writ_quote_writ_created,
        writ_creator_user_id: row.writ_quote_writ_creator_user_id,
      })
    default:
      throw newExhaustedEnumError('SourceExcerptType', row.source_excerpt_type)
  }
}

function toPropositionTagVote(row) {
  if (!row) {
    return row
  }

  return {
    id: toString(row.proposition_tag_vote_id),
    polarity: row.polarity,
    proposition: {
      id: toString(row.proposition_id),
    },
    tag: {
      id: toString(row.tag_id),
    },
  }
}

function toPropositionTagScore(row) {
  if (!row) {
    return row
  }

  return {
    propositionId: row.proposition_id,
    tagId: row.tag_id,
    scoreType: row.score_type,
    score: row.score,
    created: row.created,
    deleted: row.deleted,
    creatorJobHistoryId: row.creator_job_history_id,
    deletorJobHistoryId: row.deletor_job_history_id,
  }
}

function toTag(row) {
  if (!row) {
    return row
  }

  return {
    id: toString(row.tag_id),
    name: row.name,
  }
}

module.exports = {
  toUser,
  toProposition,
  toJustification,
  toWritQuote,
  toWrit,
  toUrl,
  toJustificationScore,
  toJustificationVote,
  toWritQuoteUrl,
  toPropositionCompound,
  toPropositionCompoundAtom,
  toPropositionTagVote,
  toPropositionTagScore,
  toTag,
  toPerspective,
  toUserHash,
  toUserExternalIds,
  toJobHistory,
  toSourceExcerptParaphrase,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
}