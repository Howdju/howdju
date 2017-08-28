import assign from 'lodash/assign'
import cloneDeep from 'lodash/cloneDeep'
import forEach from 'lodash/forEach'

import truncate from 'lodash/truncate'

import config from './config'
import {
  newImpossibleError,
  JustificationBasisType,
} from 'howdju-common'
import {ellipsis} from './characters'


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


const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: ellipsis,
  separator: /[,.]*\s+/,
}
export const isTextLong = (text) => text ? text.length > config.ui.shortTextLength : false
export const truncateCitationReferenceQuote = (quote, options) => truncate(quote, assign({}, truncateOptions, options))
export const truncateStatementText = (text, options) => truncate(text, assign({}, truncateOptions, options))
