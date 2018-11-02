import assign from 'lodash/assign'
import camelCase from 'lodash/camelCase'
import cloneDeep from 'lodash/cloneDeep'
import drop from 'lodash/drop'
import dropWhile from 'lodash/dropWhile'
import flatMap from 'lodash/flatMap'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import head from 'lodash/head'
import join from 'lodash/join'
import kebabCase from 'lodash/kebabCase'
import lowerCase from 'lodash/lowerCase'
import map from 'lodash/map'
import split from 'lodash/split'
import truncate from 'lodash/truncate'

import config from './config'
import {
  JustificationBasisType,
  newExhaustedEnumError,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
  isFalsey,
} from 'howdju-common'
import {ellipsis} from './characters'


export const removePropositionCompoundIds = (propositionCompound) => {
  if (!propositionCompound) return propositionCompound
  delete propositionCompound.id

  forEach(propositionCompound.atoms, atom => {
    delete atom.compoundId
    removePropositionIds(atom.entity)
  })
  return propositionCompound
}

export const removePropositionIds = (proposition) => {
  delete proposition.id
  return proposition
}

export const removeWritQuoteIds = (writQuote) => {
  delete writQuote.id
  delete writQuote.writ.id
  return writQuote
}

export const removeJustificationBasisCompoundIds = (justificationBasisCompound) => {
  delete justificationBasisCompound.id
  forEach(justificationBasisCompound.atoms, (atom) => {
    delete atom.id
    delete atom.compoundId
    switch (atom.type) {
      case JustificationBasisCompoundAtomType.PROPOSITION:
        removePropositionIds(atom.entity)
        break
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        removeSourceExcerptParaphraseIds(atom.entity)
        break
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
    }
  })
}

export const removeSourceExcerptParaphraseIds = (sourceExcerptParaphrase) => {
  delete sourceExcerptParaphrase.id
  delete sourceExcerptParaphrase.sourceExcerpt.entity.id
  switch (sourceExcerptParaphrase.sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      delete sourceExcerptParaphrase.sourceExcerpt.entity.writ.id
      break
    case SourceExcerptType.PIC_REGION:
      delete sourceExcerptParaphrase.sourceExcerpt.entity.pic.id
      break
    case SourceExcerptType.VID_SEGMENT:
      delete sourceExcerptParaphrase.sourceExcerpt.entity.vid.id
      break
    default:
      throw newExhaustedEnumError('SourceExcerptType', sourceExcerptParaphrase.sourceExcerpt.type)
  }
}

export const consolidateNewJustificationEntities = (newJustification) => {
  const justification = cloneDeep(newJustification)
  switch (justification.basis.type) {
    case JustificationBasisType.PROPOSITION_COMPOUND:
      justification.basis.entity = justification.basis.propositionCompound
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
  delete justification.basis.propositionCompound
  delete justification.basis.writQuote
  delete justification.basis.justificationBasisCompound

  return justification
}

export function consolidateNewJustificationBasisCompoundEntities(newJustificationBasisCompound) {
  const justificationBasisCompound = cloneDeep(newJustificationBasisCompound)
  justificationBasisCompound.atoms = map(justificationBasisCompound.atoms, atom => {
    switch (atom.type) {
      case JustificationBasisCompoundAtomType.PROPOSITION:
        atom.entity = atom.proposition
        break
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        atom.entity = consolidateNewSourcExcerptParaphraseEntities(atom.sourceExcerptParaphrase)
        break
    }
    delete atom.proposition
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

export function translateNewJustificationErrors(newJustification, errors) {
  if (!newJustification || !errors) {
    return errors
  }

  const newJustificationErrors = cloneDeep(errors)
  const basisFieldErrors = newJustificationErrors.fieldErrors.basis.fieldErrors
  switch (newJustification.basis.type) {
    case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND: {
      basisFieldErrors.justificationBasisCompound = errors.fieldErrors.basis.fieldErrors.entity
      const atomItemErrors = get(basisFieldErrors, 'justificationBasisCompound.fieldErrors.atoms.itemErrors')
      forEach(atomItemErrors, (itemErrors, i) => {
        const atom = newJustification.basis.justificationBasisCompound.atoms[i]
        switch (atom.type) {
          case JustificationBasisCompoundAtomType.PROPOSITION:
            itemErrors.fieldErrors.proposition = itemErrors.fieldErrors.entity
            break
          case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE: {
            itemErrors.fieldErrors.sourceExcerptParaphrase = itemErrors.fieldErrors.entity
            const sourceExcerptFieldErrors = itemErrors.fieldErrors.sourceExcerptParaphrase.fieldErrors.sourceExcerpt.fieldErrors
            switch (atom.sourceExcerptParaphrase.sourceExcerpt.type) {
              case SourceExcerptType.WRIT_QUOTE:
                sourceExcerptFieldErrors.writQuote = sourceExcerptFieldErrors.entity
                break
              case SourceExcerptType.PIC_REGION:
                sourceExcerptFieldErrors.picRegion = sourceExcerptFieldErrors.entity
                break
              case SourceExcerptType.VID_SEGMENT:
                sourceExcerptFieldErrors.vidSegment = sourceExcerptFieldErrors.entity
                break
              default:
                throw newExhaustedEnumError('SourceExcerptType', atom.sourceExcerptParaphrase.sourceExcerpt.type)
            }
            break
          }
          default:
            throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
        }
      })
      break
    }
    case JustificationBasisType.PROPOSITION_COMPOUND:
      basisFieldErrors.propositionCompound = errors.fieldErrors.basis.fieldErrors.entity
      break
    case JustificationBasisType.WRIT_QUOTE:
      basisFieldErrors.writQuote = errors.fieldErrors.basis.fieldErrors.entity
      break
    default:
      throw newExhaustedEnumError('JustificationBasisType', newJustification.basis.type)
  }

  return newJustificationErrors
}


const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: ellipsis,
  separator: /[,.]*\s+/,
}
export const isTextLong = (text) => text ? text.length > config.ui.shortTextLength : false
export const truncateWritQuoteText = (quoteText, options) => truncate(quoteText, assign({}, truncateOptions, options))


export function sourceExcerptDescription(sourceExcerpt) {
  return lowerCase(sourceExcerpt.type)
}

export function sourceExcerptIconName(sourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      return "format_quote"
    case SourceExcerptType.PIC_REGION:
      return "photo"
    case SourceExcerptType.VID_SEGMENT:
      return "videocam"
    default:
      throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
  }
}

export function sourceExcerptSourceDescription(sourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      return "writ"
    case SourceExcerptType.PIC_REGION:
      return "pic"
    case SourceExcerptType.VID_SEGMENT:
      return "vid"
    default:
      throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
  }
}

export function combineIds(...ids) {
  const idDelimiter = '--'
  // Ids aren't always passed by the parent, so filter out the initial falsey ones
  ids = dropWhile(ids, isFalsey)
  // if ids are internally using the delimiter, split them up by it
  ids = flatMap(ids, id => split(id, idDelimiter))
  // ensure the resulting tokens are kebab-cased
  ids = map(ids, kebabCase)
  return join(ids, idDelimiter)
}

export function combineSuggestionsKeys(...keys) {
  // If the initial suggestions key is falsy, return it to indicate no suggestions
  if (!head(keys)) {
    return head(keys)
  }
  keys = flatMap(keys, key => split(key, '.'))
  keys = map(keys, camelCase)
  return join(keys, '.')
}


/**
 * A data wrapper class that indicates that a value needs to be referenced as an array index
 *
 * e.g. combineNames('foo', ArrayIndex(2), 'bar') === 'foo[2].bar'
 */
class ArrayIndex {
  constructor(index) {
    this.index = index
  }
}
/** convenience factory for ArrayIndex */
export function array(index) {
  return new ArrayIndex(index)
}

export function combineNames(...names) {
  // Don't convert case; the names must match the object model for use with get/set
  // I think each and every name should be truthy.  How else could they be relied upon for get/set?
  names = dropWhile(names, isFalsey)
  const firstName = head(names)
  const remainingNames = drop(names, 1)
  const remainingNamesWithConnector = map(remainingNames, (n) => n instanceof ArrayIndex ? `[${n.index}]` : `.${n}`)
  names = [firstName].concat(remainingNamesWithConnector)
  return join(names, '')
}

export function makeChip(props) {
  return cloneDeep(props)
}