import assign from 'lodash/assign'
import map from 'lodash/map'
import merge from 'lodash/merge'
import {logError} from "./util";
import cloneDeep from 'lodash/cloneDeep'

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
export const isStatementBased = j => j.basis.type === JustificationBasisType.STATEMENT

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

export const makeNewJustification = props => merge({
  rootStatementId: null,
  polarity: JustificationPolarity.POSITIVE,
  target: {
    type: JustificationTargetType.STATEMENT,
    entity: {
      id: null
    }
  },
  basis: {
    type: JustificationBasisType.STATEMENT,
    // Store both these types directly on the basis for the view-model
    // Before the justification is sent to the server, the one corresponding to the current type should be put on the
    // entity property
    citationReference: {
      citation: {
        text: '',
      },
      quote: '',
      urls: [{url: ''}],
    },
    statement: {
      text: ''
    }
  }
}, props)

export const consolidateBasis = justification => {
  const cloneJustification = cloneDeep(justification);
  switch (cloneJustification.basis.type) {
    case JustificationBasisType.STATEMENT:
      cloneJustification.basis.entity = cloneJustification.basis.statement
      break
    case JustificationBasisType.CITATION_REFERENCE:
      cloneJustification.basis.entity = cloneJustification.basis.citationReference
      break
    default:
      logError(`newJustification had impossible basis type: ${cloneJustification.basis.type}.  Defaulting to statement basis`)
      cloneJustification.basis.entity = cloneJustification.basis.statement
      break
  }
  delete cloneJustification.basis.statement
  delete cloneJustification.basis.citationReference

  return cloneJustification
}