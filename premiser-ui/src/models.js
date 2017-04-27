import assign from 'lodash/assign'
import map from 'lodash/map'

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
export const isCounter = j => j.target.type === JustificationTargetType.JUSTIFICATION && isNegative(j)

/** retain only the necessary identifying properties from target to prevent circular references */
export const decircularTargetJustification = target =>
    // or pick(target, ['type', 'entity.id'])
    ({type: target.type, entity: { id: target.entity.id } })

export const decircularizeCounterJustification = justification => isCounter(justification) ?
    // overwrite the target
    assign({}, justification, { target: decircularTargetJustification(justification.target) } ) :
    justification

export const decircularizeCounterJustifications = justifications => justifications && map(justifications, j => isCounter(j) ?
    decircularizeCounterJustification(j) :
    assign({}, j, j.counterJustifications && {
      counterJustifications: decircularizeCounterJustifications(j.counterJustifications)
    })
)