const {ImpossibleError} = require('./errors')

const EntityTypes = {
  STATEMENT: 'STATEMENT',
  CITATION: 'CITATION',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  JUSTIFICATION: 'JUSTIFICATION',
  USER: 'USER',
}

const ActionType = {
  /** The user created something */
  CREATE: 'CREATE',
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  TRY_CREATE_DUPLICATE: 'TRY_CREATE_DUPLICATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSOCIATE: 'ASSOCIATE',
  DISASSOCIATE: 'DISASSOCIATE',
}

const ActionTargetType = {
  STATEMENT: 'STATEMENT',
  STATEMENT_COMPOUND: 'STATEMENT_COMPOUND',
  JUSTIFICATION: 'JUSTIFICATION',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  CITATION: 'CITATION',
  USER: 'USER',
  URL: 'URL',
}

const ActionSubjectType = {
  URL: 'URL',
}

const JustificationTargetType = {
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION'
}

const JustificationPolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}
const JustificationRootPolarity = JustificationPolarity

const VotePolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}

const JustificationBasisType = {
  STATEMENT_COMPOUND: 'STATEMENT_COMPOUND',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
}

const VoteTargetType = {
  JUSTIFICATION: 'JUSTIFICATION',
  TAGGING: 'TAGGING',
}

const negateVotePolarity = polarity => {
  switch (polarity) {
    case VotePolarity.POSITIVE:
      return VotePolarity.NEGATIVE
    case VotePolarity.NEGATIVE:
      return VotePolarity.POSITIVE
    default:
      throw new ImpossibleError(`Unsupported vote polarity for negation: ${polarity}`)
  }
}

const negateRootPolarity = rootPolarity => {
  switch (rootPolarity) {
    case JustificationRootPolarity.POSITIVE:
      return JustificationRootPolarity.NEGATIVE
    case JustificationRootPolarity.NEGATIVE:
      return JustificationRootPolarity.POSITIVE
    default:
      throw new ImpossibleError(`unsupported root polarity: ${rootPolarity}`)
  }
}

const SortDirection = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
}

/** Shorter than SortDirection so that the continuations tokens are smaller */
const ContinuationSortDirection = {
  ASCENDING: 'a',
  DESCENDING: 'd',
}

module.exports = {
  ActionType,
  ActionTargetType,
  ActionSubjectType,
  JustificationTargetType,
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationBasisType,
  VotePolarity,
  VoteTargetType,
  negateVotePolarity,
  negateRootPolarity,
  EntityTypes,
  SortDirection,
  ContinuationSortDirection,
}