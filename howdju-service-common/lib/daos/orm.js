const isArray = require('lodash/isArray')
const map = require('lodash/map')
const merge = require('lodash/merge')
const sortBy = require('lodash/sortBy')
const toString = require('lodash/toString')
const values = require('lodash/values')

const {
  JustificationBasisCompoundAtomTypes,
  JustificationBasisTypes,
  JustificationRootTargetTypes,
  newExhaustedEnumError,
  newImpossibleError,
  PropositionCompoundAtomTypes,
  requireArgs,
  SentenceTypes,
  SourceExcerptTypes,
  toSlug,
} = require('howdju-common')

// We use a convention of translating IDs to strings.
//
// Also, there's a built-in toString that does weird things. So rather than
// accidentally use it by forgetting to import toString from lodash, use this
// method.
function toIdString(val) {
  return toString(val)
}

function fromIdString(val) {
  return parseInt(val)
}

function removeUndefinedProperties(obj) {
  let hasDefinedProperty = false
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key]
    } else {
      hasDefinedProperty = true
    }
  }

  return hasDefinedProperty ? obj : null
}

function makeMapper(mapper) {
  return function(row, ...args) {
    if (!row) {
      return row
    }

    let mapped = mapper(row, ...args)
    if (!mapped.id && row.id) {
      mapped.id = toIdString(row.id)
    }
    mapped = removeUndefinedProperties(mapped)
    return mapped
  }
}

function mapRelation (mapper, prefix, row) {
  requireArgs({mapper, prefix, row})
  const unprefixed = unprefix(row, prefix)
  const mapped = mapper(unprefixed)
  return mapped
}

/** Returns a new object containing the key/values of `obj`
 * for keys whose names start with `prefix` but with that prefix removed
 */
function unprefix (obj, prefix) {
  const unprefixed = {}
  let hasPrefixedKey = false
  for (const key of Object.keys(obj)) {
    if (key.startsWith(prefix)) {
      hasPrefixedKey = true
      const unprefixedKey = key.substr(prefix.length)
      unprefixed[unprefixedKey] = obj[key]
    }
  }
  return hasPrefixedKey ? unprefixed : null
}

const toUser = makeMapper(function toUserMapper(row) {
  const user = merge({
    id: toIdString(row.user_id),
  }, {
    email: row.email,
    username: row.username,
    longName: row.long_name,
    shortName: row.short_name,
    created: row.created,
    isActive: row.is_active,
    externalIds: toUserExternalIds(row),
  })

  return user
})

const toUserExternalIds = makeMapper(function(row) {
  return {
    googleAnalyticsId: row.google_analytics_id,
    heapAnalyticsId: row.heap_analytics_id,
    mixpanelId: row.mixpanel_id,
    sentryId: row.sentry_id,
    smallchatId: row.smallchat_id,
  }
})

const toProposition = makeMapper(function toPropositionMapper(row) {
  const proposition = {
    id: toIdString(row.proposition_id),
    text: row.text,
    normalText: row.normal_text,
    slug: toSlug(row.normal_text),
    created: row.created,
  }

  if (row.creator_user_id) {
    proposition.creator = toUser({
      user_id: row.creator_user_id,
      long_name: row.creator_user_long_name,
    })
  }

  return proposition
})

const toStatement = makeMapper(function toStatementMapper(row) {

  const statement = {
    id: toIdString(row.statement_id || row.id),
    creator: mapRelation(toUser, 'creator_', row),
    speaker: mapRelation(toPersorg, 'speaker_', row),
    sentenceType: row['sentence_type'],
    created: row.created,
  }

  let sentence = statement['sentence'] = {id: row['sentence_id']}
  switch (statement.sentenceType) {
    case SentenceTypes.STATEMENT:
      sentence = mapRelation(toStatement, 'sentence_statement_', row)
      break
    case SentenceTypes.PROPOSITION:
      sentence = mapRelation(toProposition, 'sentence_proposition_', row)
      break
    default:
      // statements don't need to include their sentence if they have an ID
      break
  }
  if (sentence) {
    statement['sentence'] = sentence
  }
  return statement
})

const justificationRootTargetMapperByType = {
  [JustificationRootTargetTypes.PROPOSITION]: toProposition,
  [JustificationRootTargetTypes.STATEMENT]: toStatement,
}

const toJustification = makeMapper(function toJustificationMapper (
  row,
  counterJustificationsByJustificationId,
  propositionCompoundsById,
  writQuotesById,
  justificationBasisCompoundsById
) {
  const justification = {
    id: toIdString(row.justification_id || row.id),
    created: row.created,
    rootTargetType: row.root_target_type,
    rootTarget: mapRelation(justificationRootTargetMapperByType[row.root_target_type], 'root_target_', row),
    rootPolarity: row.root_polarity,
    target: {
      type: row.target_type,
      entity: {
        id: toIdString(row.target_id),
      },
    },
    basis: {
      type: row.basis_type,
      entity: {
        id: toIdString(row.basis_id),
      },
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
    case JustificationBasisTypes.WRIT_QUOTE: {
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

    case JustificationBasisTypes.PROPOSITION_COMPOUND: {
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

    case JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND: {
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
      throw newImpossibleError(`Unsupported JustificationBasisTypes: ${row.basis_type}`)
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
})

const toWritQuote = makeMapper(function toWritQuoteMapper(row) {
  return {
    id: toIdString(row.writ_quote_id),
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
})

const toWrit = makeMapper(function toWritMapper(row) {
  const writ = row && ({
    id: toIdString(row.writ_id),
    title: row.title,
    created: row.created,
  })
  return writ
})

const toUrl = makeMapper(function toUrlMapper(row) {
  return {
    id: toIdString(row.url_id),
    url: row.url,
  }
})

const toJustificationVote = makeMapper(function toJustificationVoteMapper(row) {
  return {
    id: toIdString(row.justification_vote_id),
    polarity: row.polarity,
    justificationId: row.justification_id,
    created: row.created,
    deleted: row.deleted,
  }
})

const toWritQuoteUrl = makeMapper(function toWriteQuoteUrlMapper(row) {
  return {
    writQuoteId: toIdString(row.writ_quote_id),
    urlId: toIdString(row.url_id),
  }
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
  type: PropositionCompoundAtomTypes.PROPOSITION,
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
    case JustificationBasisCompoundAtomTypes.PROPOSITION:
      if (row.proposition_id) {
        atom.entity = toProposition({
          proposition_id: row.proposition_id,
          text: row.proposition_text,
          created: row.proposition_created,
          creator_user_id: row.proposition_creator_user_id,
        })
      }
      break
    case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE:
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
        id: row.source_excerpt_id,
      },
    },
  })

  const paraphrasingProposition = toProposition({
    proposition_id: row.paraphrasing_proposition_id,
    text: row.paraphrasing_proposition_text,
    created: row.paraphrasing_proposition_created,
    creator_user_id: row.paraphrasing_proposition_creator_user_id,
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
    case SourceExcerptTypes.WRIT_QUOTE:
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
      throw newExhaustedEnumError(row)
  }
}

function toPropositionTagVote(row) {
  if (!row) {
    return row
  }

  return {
    id: toIdString(row.proposition_tag_vote_id),
    polarity: row.polarity,
    proposition: {
      id: toIdString(row.proposition_id),
    },
    tag: {
      id: toIdString(row.tag_id),
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

const toTag = makeMapper(function toTagMapper(row) {
  return {
    id: toIdString(row.tag_id),
    name: row.name,
  }
})

const toPersorg = makeMapper(function toPersorgMapper(row) {
  const persorg = {
    id: toIdString(row.persorg_id),
    isOrganization: row.is_organization,
    name: row.name,
    knownFor: row.known_for,
    websiteUrl: row.website_url,
    twitterUrl: row.twitter_url,
    wikipediaUrl: row.wikipedia_url,
    normalName: row.normal_name,
    created: row.created,
    modified: row.modified,
  }

  if (row.creator_user_id) {
    persorg.creator = toUser({
      user_id: row.creator_user_id,
    })
  }

  return persorg
})

const toRegistrationRequest = makeMapper(function toRegistrationRequestMapper(row) {
  return {
    id: row.registration_request_id,
    email: row.email,
    registrationCode: row.registration_code,
    isConsumed: row.is_consumed,
    expires: row.expires,
    created: row.created,
    deleted: row.deleted,
  }
})

const toPasswordResetRequest = makeMapper(function toPasswordResetRequestMapper(row) {
  return {
    id: row.password_reset_request_id,
    userId: row.user_id,
    email: row.email,
    passwordResetCode: row.password_reset_code,
    expires: row.expires,
    isConsumed: row.isConsumed,
    created: row.created,
    deleted: row.deleted,
  }
})

const toAccountSettings = makeMapper(function toAccountSettingsMapper(row) {
  return {
    id: toIdString(row.account_settings_id),
    userId: toIdString(row.user_id),
    paidContributionsDisclosure: row.paid_contributions_disclosure,
  }
})

const toContentReport = makeMapper(function toContentReportMapper(row) {
  return {
    id: toIdString(row.content_report_id),
    entityType: row.entity_type,
    entityId: row.entity_id,
    url: row.url,
    types: row.types,
    description: row.description,
    reporterUserId: row.reporter_user_id,
    created: row.created,
  }
})

module.exports = {
  fromIdString,
  toAccountSettings,
  toContentReport,
  toIdString,
  toJobHistory,
  toJustification,
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toJustificationScore,
  toJustificationVote,
  toPasswordResetRequest,
  toPersorg,
  toPerspective,
  toProposition,
  toPropositionCompound,
  toPropositionCompoundAtom,
  toPropositionTagVote,
  toPropositionTagScore,
  toRegistrationRequest,
  toSourceExcerptParaphrase,
  toStatement,
  toTag,
  toUrl,
  toUserExternalIds,
  toUserHash,
  toUser,
  toWrit,
  toWritQuote,
  toWritQuoteUrl,
}
