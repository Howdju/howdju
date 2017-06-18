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
export const hasQuote = j => isCitationReferenceBased(j) && j.basis.entity.quote
export const isCitationReferenceBased = j =>j.basis.type === JustificationBasisType.CITATION_REFERENCE

export const decircularizeTarget = justification => {
  if (justification.target.entity.id) {
    // If the target already has an ID, then just send that along; that is enough for the server to identify it.
    // This transformation probably applies to basis and any other entities.  But it is particularly important for
    // justification targets, because the target may be a justification having circular references.
    justification = {...justification, target: {...justification.target, entity: { id: justification.target.entity.id}}}
  }
  return justification
}

export const makeNewCredentials = () => ({email: '', password: ''})

export const makeNewStatement = props => ({text: '', ...props})

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

export const makeNewStatementJustification = (statementProps, justificationProps) => ({
  statement: makeNewStatement(statementProps),
  justification: makeNewJustification(justificationProps),
  doCreateJustification: !!justificationProps,
})

export const makeNewCounterJustification = targetJustification => ({
  rootStatementId: targetJustification.rootStatementId,
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.STATEMENT,
    entity: {text: ''}
  },
  polarity: JustificationPolarity.NEGATIVE
})

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

export const makeNewUrl = () => ({url: ''})

export const justificationBasisTypeToNewJustificationBasisMemberName = justificationBasisType => {
  const newJustificationBasisMemberNames = {
    [JustificationBasisType.STATEMENT]: 'statement',
    [JustificationBasisType.CITATION_REFERENCE]: 'citationReference'
  }
  const newJustificationBasisMemberName = newJustificationBasisMemberNames[justificationBasisType]
  if (!newJustificationBasisMemberName) {
    throw newImpossibleError(`${justificationBasisType} exhausted justification basis types`)
  }
}