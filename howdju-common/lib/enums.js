const assign = require('lodash/assign')

const {
  arrayToObject
} = require('./general')

const _e = module.exports

_e.EntityType = arrayToObject([
  'STATEMENT',
  'WRIT',
  'WRIT_QUOTE',
  'JUSTIFICATION',
  'USER',
  'PASSWORD_HASH',
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
  'STATEMENT',
  'STATEMENT_COMPOUND',
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

_e.JustificationTargetType = arrayToObject([
  'STATEMENT',
  'JUSTIFICATION',
])

_e.JustificationPolarity = arrayToObject([
  'POSITIVE',
  'NEGATIVE',
])
// For now they have the same values, but let's at least keep track of the usages separately
_e.JustificationRootPolarity = _e.JustificationPolarity

_e.JustificationBasisType = arrayToObject([
  /* One or more statements */
  'STATEMENT_COMPOUND',
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
  'STATEMENT',
  'SOURCE_EXCERPT_PARAPHRASE',
]))

_e.JustificationBasisCompoundAtomType = arrayToObject([
  'STATEMENT',
  'SOURCE_EXCERPT_PARAPHRASE',
])

_e.SourceExcerptType = arrayToObject([
  'WRIT_QUOTE',
  'PIC_REGION',
  'VID_SEGMENT',
])

_e.VoteTargetType = arrayToObject([
  'JUSTIFICATION',
  'TAGGING',
])

_e.VotePolarity = arrayToObject([
  'POSITIVE',
  'NEGATIVE',
])
_e.JustificationVotePolarity = _e.VotePolarity

_e.SortDirection = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
}

_e.JustificationScoreType = arrayToObject([
  'GLOBAL_VOTE_SUM',
])

_e.JobHistoryStatus = arrayToObject([
  'SUCCESS',
  'FAILURE',
])

_e.StatementCompoundAtomType = arrayToObject([
  'STATEMENT',
])

_e.ValidJustificationSearchFilters = [
  'writQuoteId',
  'writId',
  'statementCompoundId',
  'sourceExcerptParaphraseId',
  'statementId',
]