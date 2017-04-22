export const JustificationTargetType = {
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION'
}

export const JustificationPolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}

export const JustificationBasisType = {
  STATEMENT: 'STATEMENT',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
}

export const VoteTargetType = {
  JUSTIFICATION: 'JUSTIFICATION',
  TAGGING: 'TAGGING',
}

export const VotePolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}

export const isPositive = j => j.polarity === JustificationPolarity.POSITIVE
export const isNegative = j => j.polarity === JustificationPolarity.NEGATIVE
export const isVerified = j => j.vote && j.vote.polarity === VotePolarity.POSITIVE
export const isDisverified = j => j.vote && j.vote.polarity === VotePolarity.NEGATIVE