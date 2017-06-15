const {ImpossibleError} = require('./errors')

const EntityTypes = {
  STATEMENT: 'STATEMENT'
}

const ActionType = {
  /** The user created something */
  CREATE: 'CREATE',
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  TRY_CREATE_DUPLICATE: 'TRY_CREATE_DUPLICATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
}

const ActionTargetType = {
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  CITATION: 'CITATION',
  USER: 'USER',
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

const VotePolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}

const JustificationBasisType = {
  STATEMENT: 'STATEMENT',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
}

const VoteTargetType = {
  JUSTIFICATION: 'JUSTIFICATION',
  TAGGING: 'TAGGING',
}

const negatePolarity = polarity => {
  switch (polarity) {
    case VotePolarity.POSITIVE:
      return VotePolarity.NEGATIVE
    case VotePolarity.NEGATIVE:
      return VotePolarity.POSITIVE
    default:
      throw new ImpossibleError(`Unsupported vote polarity for negation: ${polarity}`)
  }
}

module.exports = {
  ActionType,
  ActionTargetType,
  JustificationTargetType,
  JustificationPolarity,
  JustificationBasisType,
  VotePolarity,
  VoteTargetType,
  negatePolarity,
  EntityTypes,
}