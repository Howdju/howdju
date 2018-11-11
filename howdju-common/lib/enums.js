const assign = require('lodash/assign')

const {
  arrayToObject
} = require('./general')

const _e = module.exports

_e.EntityType = arrayToObject([
  'PROPOSITION',
  'STATEMENT',
  'WRIT',
  'WRIT_QUOTE',
  'JUSTIFICATION',
  'USER',
  'PASSWORD_HASH',
  'PROPOSITION_TAG_VOTE',
  'JUSTIFICATION_VOTE',
])

_e.ActionType = arrayToObject([
  /** The user created something */
  'CREATE',
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  'TRY_CREATE_DUPLICATE',
  'UPDATE',
  'DELETE',
  'ASSOCIATE',
  'DISASSOCIATE',
])

_e.ActionTargetType = arrayToObject([
  'PROPOSITION',
  'PROPOSITION_COMPOUND',
  'JUSTIFICATION',
  'JUSTIFICATION_BASIS_COMPOUND',
  'JUSTIFICATION_BASIS_COMPOUND_ATOM',
  'SOURCE_EXCERPT_PARAPHRASE',
  'WRIT_QUOTE',
  'WRIT',
  'PIC_REGION',
  'PIC',
  'VID_SEGMENT',
  'VID',
  'USER',
  'URL',
])

_e.ActionSubjectType = arrayToObject([
  'URL',
])

_e.JustificationRootTargetType = arrayToObject([
  'PROPOSITION',
  'STATEMENT',
])
// A justification can target anything that can be a root target.
// Additionally, it can target other justifications to counter them.
_e.JustificationTargetType = assign({},
  _e.JustificationRootTargetType,
  arrayToObject([
    'JUSTIFICATION',
  ])
)

_e.JustificationPolarity = arrayToObject([
  'POSITIVE',
  'NEGATIVE',
])
// For now they have the same values, but let's at least keep track of the usages separately
_e.JustificationRootPolarity = _e.JustificationPolarity

_e.JustificationBasisType = arrayToObject([
  /* One or more propositions */
  'PROPOSITION_COMPOUND',
  /* A quote */
  'WRIT_QUOTE',
  /* One or more {@see JustificationBasisCompoundAtomType}s
   *
   * This type will replace the others
   */
  'JUSTIFICATION_BASIS_COMPOUND',
])
// Anything you can start with to create a justification based upon.
// (Which would include JustificationBasisTypes, too, but right now we are only adding those here that aren't also JustificationBasisTypes)
_e.JustificationBasisSourceType = assign({}, _e.JustificationBasisType, arrayToObject([
  'PROPOSITION',
  'SOURCE_EXCERPT_PARAPHRASE',
]))

_e.JustificationBasisCompoundAtomType = arrayToObject([
  'PROPOSITION',
  'SOURCE_EXCERPT_PARAPHRASE',
])

_e.SourceExcerptType = arrayToObject([
  'WRIT_QUOTE',
  'PIC_REGION',
  'VID_SEGMENT',
])

_e.JustificationVotePolarity = arrayToObject([
  'POSITIVE',
  'NEGATIVE',
])
_e.PropositionTagVotePolarity = arrayToObject([
  'POSITIVE',
  'NEGATIVE',
])

_e.SortDirection = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
}

_e.JustificationScoreType = arrayToObject([
  'GLOBAL_VOTE_SUM',
])

_e.PropositionTagScoreType = arrayToObject([
  'GLOBAL_VOTE_SUM',
])

_e.JobHistoryStatus = arrayToObject([
  'SUCCESS',
  'FAILURE',
])

_e.PropositionCompoundAtomType = arrayToObject([
  'PROPOSITION',
])

_e.ValidJustificationSearchFilters = [
  'writQuoteId',
  'writId',
  'propositionCompoundId',
  'sourceExcerptParaphraseId',
  'propositionId',
]

_e.SentenceType = arrayToObject([
  'PROPOSITION',
  'STATEMENT',
])
