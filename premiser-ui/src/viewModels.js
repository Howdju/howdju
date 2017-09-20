import assign from 'lodash/assign'
import cloneDeep from 'lodash/cloneDeep'
import forEach from 'lodash/forEach'
import map from 'lodash/map'

import truncate from 'lodash/truncate'

import config from './config'
import {
  JustificationBasisType,
  newExhaustedEnumError,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
} from 'howdju-common'
import {ellipsis} from './characters'


export const removeStatementCompoundId = (statementCompound) => {
  if (!statementCompound) return statementCompound
  delete statementCompound.id
  forEach(statementCompound.atoms, atom => {
    delete atom.compoundId
  })
  return statementCompound
}

export const consolidateNewJustificationEntities = (newJustification) => {
  const justification = cloneDeep(newJustification)
  switch (justification.basis.type) {
    case JustificationBasisType.STATEMENT_COMPOUND:
      justification.basis.entity = justification.basis.statementCompound
      break
    case JustificationBasisType.WRIT_QUOTE:
      justification.basis.entity = justification.basis.writQuote
      break
    case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
      justification.basis.entity = consolidateNewJustificationBasisCompoundEntities(justification.basis.justificationBasisCompound)
      break
    default:
      throw newExhaustedEnumError('JustificationBasisType', justification.basis.type)
  }
  delete justification.basis.statementCompound
  delete justification.basis.writQuote
  delete justification.basis.justificationBasisCompound

  return justification
}

export function consolidateNewJustificationBasisCompoundEntities(newJustificationBasisCompound) {
  const justificationBasisCompound = cloneDeep(newJustificationBasisCompound)
  justificationBasisCompound.atoms = map(justificationBasisCompound.atoms, atom => {
    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT:
        atom.entity = atom.statement
        break
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        atom.entity = consolidateNewSourcExcerptParaphraseEntities(atom.sourceExcerptParaphrase)
        break
    }
    delete atom.statement
    delete atom.sourceExcerptParaphrase

    return atom
  })

  return justificationBasisCompound
}

export function consolidateNewSourcExcerptParaphraseEntities(newSourceExcerptParaphrase) {
  const sourceExcerptParaphrase = cloneDeep(newSourceExcerptParaphrase)
  const sourceExcerpt = sourceExcerptParaphrase.sourceExcerpt
  switch (sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      sourceExcerpt.entity = sourceExcerpt.writQuote
      break
    case SourceExcerptType.PIC_REGION:
      sourceExcerpt.entity = sourceExcerpt.picRegion
      break
    case SourceExcerptType.VID_SEGMENT:
      sourceExcerpt.entity = sourceExcerpt.vidSegment
      break
  }
  delete sourceExcerpt.writQuote
  delete sourceExcerpt.picRegion
  delete sourceExcerpt.vidSegment

  return sourceExcerptParaphrase
}

export const justificationBasisTypeToNewJustificationBasisMemberName = (justificationBasisType) => {
  const newJustificationBasisMemberNames = {
    [JustificationBasisType.STATEMENT_COMPOUND]: 'statementCompound',
    [JustificationBasisType.WRIT_QUOTE]: 'writQuote',
    [JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND]: 'justificationBasisCompound',
  }
  const newJustificationBasisMemberName = newJustificationBasisMemberNames[justificationBasisType]
  if (!newJustificationBasisMemberName) {
    throw newExhaustedEnumError('JustificationBasisType', justificationBasisType)
  }
  return newJustificationBasisMemberName
}


const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: ellipsis,
  separator: /[,.]*\s+/,
}
export const isTextLong = (text) => text ? text.length > config.ui.shortTextLength : false
export const truncateWritQuoteText = (quoteText, options) => truncate(quoteText, assign({}, truncateOptions, options))
export const truncateStatementText = (text, options) => truncate(text, assign({}, truncateOptions, options))
