import assign from 'lodash/assign'
import cloneDeep from 'lodash/cloneDeep'
import forEach from 'lodash/forEach'
import merge from 'lodash/merge'
import truncate from 'lodash/truncate'

import config from './config'
import {newImpossibleError} from './customErrors'
import {ellipsis} from './characters'

export const JustificationTargetType = {
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION'
}

export const JustificationPolarity = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}
// For now they have the same values, but let's at least keep track of the usages separately
export const JustificationRootPolarity = JustificationPolarity

export const JustificationBasisType = {
  STATEMENT_COMPOUND: 'STATEMENT_COMPOUND',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
}
// Anything you can start with to create a justification based upon.
// (Which would include JustificationBasisTypes, too, but right now we are only adding those here that aren't also JustificationBasisTypes)
export const JustificationBasisSourceType = {
  STATEMENT: 'STATEMENT',
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
export const isRootPositive = j => j.rootPolarity === JustificationRootPolarity.POSITIVE
export const isRootNegative = j => j.rootPolarity === JustificationRootPolarity.NEGATIVE
export const isVerified = j => j.vote && j.vote.polarity === VotePolarity.POSITIVE
export const isDisverified = j => j.vote && j.vote.polarity === VotePolarity.NEGATIVE
export const isCounter = j => j.target.type === JustificationTargetType.JUSTIFICATION && isNegative(j)
export const isRootJustification = j =>
  j.target.type === JustificationTargetType.STATEMENT &&
  j.target.entity.id === j.rootStatement.id
export const hasQuote = j => isCitationReferenceBased(j) && j.basis.entity.quote
export const isStatementCompoundBased = j => j ? j.basis.type === JustificationBasisType.STATEMENT_COMPOUND : false
export const isCitationReferenceBased = j => j ? j.basis.type === JustificationBasisType.CITATION_REFERENCE : false

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
  rootStatement: {id: null},
  polarity: JustificationPolarity.POSITIVE,
  target: {
    type: JustificationTargetType.STATEMENT,
    entity: {
      id: null
    }
  },
  basis: {
    type: JustificationBasisType.STATEMENT_COMPOUND,
    // Store both these types directly on the basis for the view-model
    // Before the justification is sent to the server, the one corresponding to the current type should be put on the
    // entity property
    citationReference: makeNewCitationReference(),
    statementCompound: makeNewStatementCompound()
  }
}, props)

export const makeNewCitation = () => ({
  text: '',
})

export const makeNewCitationReference = () => ({
  citation: makeNewCitation(),
  quote: '',
  urls: [makeNewUrl()],
})

export const makeNewStatementCompound = props => ({
  atoms: [makeNewStatementAtom()],
  ...props,
})

export const makeNewStatementAtom = props => ({
  statement: makeNewStatement(),
  ...props,
})

export const makeNewStatementCompoundForStatement = statement =>
    makeNewStatementCompound({atoms: [makeNewStatementAtom({statement})]})

export const makeNewJustificationTargetingStatementId = statementId => makeNewJustification({
  rootStatement: {id: statementId},
  target: { type: JustificationTargetType.STATEMENT, entity: { id: statementId } }
})

export const makeNewStatementJustification = (statementProps, justificationProps) => ({
  statement: makeNewStatement(statementProps),
  justification: makeNewJustification(justificationProps),
  doCreateJustification: !!justificationProps,
})

export const makeNewCounterJustification = targetJustification => ({
  rootStatement: {id: targetJustification.rootStatement.id},
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.STATEMENT_COMPOUND,
    entity: makeNewStatementCompound()
  },
  polarity: JustificationPolarity.NEGATIVE
})

export const removeStatementCompoundId = statementCompound => {
  if (!statementCompound) return statementCompound
  delete statementCompound.id
  forEach(statementCompound.atoms, atom => {
    delete atom.statementCompoundId
  })
  return statementCompound
}

export const consolidateBasis = newJustification => {
  const justification = cloneDeep(newJustification);
  switch (justification.basis.type) {
    case JustificationBasisType.STATEMENT_COMPOUND:
      justification.basis.entity = justification.basis.statementCompound
      break
    case JustificationBasisType.CITATION_REFERENCE:
      justification.basis.entity = justification.basis.citationReference
      break
    default:
      throw newImpossibleError(`${justification.basis.type} exhausted justification basis types`)
  }
  delete justification.basis.statementCompound
  delete justification.basis.citationReference

  return justification
}

export const makeNewUrl = () => ({url: ''})

export const justificationBasisTypeToNewJustificationBasisMemberName = justificationBasisType => {
  const newJustificationBasisMemberNames = {
    [JustificationBasisType.STATEMENT_COMPOUND]: 'statementCompound',
    [JustificationBasisType.CITATION_REFERENCE]: 'citationReference'
  }
  const newJustificationBasisMemberName = newJustificationBasisMemberNames[justificationBasisType]
  if (!newJustificationBasisMemberName) {
    throw newImpossibleError(`${justificationBasisType} exhausted justification basis types`)
  }
  return newJustificationBasisMemberName
}

export const SortDirection = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
}


const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: ellipsis,
  separator: /[,.]*\s+/,
}
export const isTextLong = (text) => text ? text.length > config.ui.shortTextLength : false
export const truncateCitationReferenceQuote = quote => truncate(quote, truncateOptions)
export const truncateStatementText = (text, options) => truncate(text, assign({}, truncateOptions, options))
