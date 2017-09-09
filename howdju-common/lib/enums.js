const {
  arrayToObject
} = require('./general')

const _e = module.exports

_e.EntityTypes = arrayToObject([
  'STATEMENT',
  'WRITING',
  'WRITING_QUOTE',
  'JUSTIFICATION',
  'USER',
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
  'WRITING_QUOTE',
  'WRITING',
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
  'STATEMENT_COMPOUND',
  'WRITING_QUOTE',
])
// Anything you can start with to create a justification based upon.
// (Which would include JustificationBasisTypes, too, but right now we are only adding those here that aren't also JustificationBasisTypes)
_e.JustificationBasisSourceType = arrayToObject([
  'STATEMENT',
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

/** Shorter than SortDirection so that the continuations tokens are smaller */
_e.ContinuationSortDirection = {
  ASCENDING: 'a',
  DESCENDING: 'd',
}

_e.JustificationScoreType = arrayToObject([
  'GLOBAL_VOTE_SUM',
])

_e.JobHistoryStatus = arrayToObject([
  'SUCCESS',
  'FAILURE',
])

_e.JustificationBasisAtomType = arrayToObject([
  'STATEMENT',
  'SOURCE_EXCERPT_PARAPHRASE',
])
