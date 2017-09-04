const _e = module.exports

_e.EntityTypes = {
  STATEMENT: 'STATEMENT',
  CITATION: 'CITATION',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  JUSTIFICATION: 'JUSTIFICATION',
  USER: 'USER',
}

_e.ActionType = {
  /** The user created something */
  CREATE: 'CREATE',
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  TRY_CREATE_DUPLICATE: 'TRY_CREATE_DUPLICATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSOCIATE: 'ASSOCIATE',
  DISASSOCIATE: 'DISASSOCIATE',
}

_e.ActionTargetType = {
  STATEMENT: 'STATEMENT',
  STATEMENT_COMPOUND: 'STATEMENT_COMPOUND',
  JUSTIFICATION: 'JUSTIFICATION',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  CITATION: 'CITATION',
  USER: 'USER',
  URL: 'URL',
}

_e.ActionSubjectType = {
  URL: 'URL',
}

_e.JustificationTargetType = {
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION'
}

_e.JustificationPolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}
// For now they have the same values, but let's at least keep track of the usages separately
_e.JustificationRootPolarity = _e.JustificationPolarity

_e.JustificationBasisType = {
  STATEMENT_COMPOUND: 'STATEMENT_COMPOUND',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
}
// Anything you can start with to create a justification based upon.
// (Which would include JustificationBasisTypes, too, but right now we are only adding those here that aren't also JustificationBasisTypes)
_e.JustificationBasisSourceType = {
  STATEMENT: 'STATEMENT',
}

_e.VoteTargetType = {
  JUSTIFICATION: 'JUSTIFICATION',
  TAGGING: 'TAGGING',
}

_e.VotePolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}
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

_e.JustificationScoreType = {
  GLOBAL_VOTE_SUM: 'GLOBAL_VOTE_SUM',
}

_e.JobHistoryStatus = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
}