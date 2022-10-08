import assign from 'lodash/assign'
import camelCase from 'lodash/camelCase'
import cloneDeep from 'lodash/cloneDeep'
import drop from 'lodash/drop'
import dropWhile from 'lodash/dropWhile'
import flatMap from 'lodash/flatMap'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import head from 'lodash/head'
import invert from 'lodash/invert'
import join from 'lodash/join'
import kebabCase from 'lodash/kebabCase'
import lowerCase from 'lodash/lowerCase'
import map from 'lodash/map'
import split from 'lodash/split'
import truncate from 'lodash/truncate'

import config from './config'
import {
  SourceExcerpt,
  isFalsey,
  Justification,
  JustificationBasis,
  JustificationBasisCompound,
  JustificationBasisCompoundAtomTypes,
  JustificationBasisType,
  JustificationBasisTypes,
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationRootTargetTypes,
  JustificationTarget,
  JustificationTargetTypes,
  newExhaustedEnumError,
  newImpossibleError,
  Proposition,
  PropositionCompound,
  SourceExcerptViewModel,
  SourceExcerptParaphrase,
  SourceExcerptTypes,
  WritQuote,
} from 'howdju-common'

import * as characters from './characters'
import {
  propositionSchema,
  statementSchema,
} from './normalizationSchemas'


export const removePropositionCompoundIds = (propositionCompound: PropositionCompound) => {
  if (!propositionCompound) return propositionCompound
  delete propositionCompound.id

  forEach(propositionCompound.atoms, atom => {
    delete atom.compoundId
    removePropositionIds(atom.entity)
  })
  return propositionCompound
}

export const removePropositionIds = (proposition: Proposition) => {
  delete proposition.id
  return proposition
}

export const removeWritQuoteIds = (writQuote: WritQuote) => {
  delete writQuote.id
  delete writQuote.writ.id
  return writQuote
}

export const removeJustificationBasisCompoundIds = (justificationBasisCompound: JustificationBasisCompound) => {
  delete justificationBasisCompound.id
  forEach(justificationBasisCompound.atoms, (atom) => {
    delete atom.id
    delete atom.compoundId
    switch (atom.type) {
      case JustificationBasisCompoundAtomTypes.PROPOSITION:
        removePropositionIds(atom.entity)
        break
      case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE:
        // TODO make the SourceExcerpt type generic up the whole object graph?
        removeSourceExcerptParaphraseIds(atom.entity)
        break
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomTypes', atom)
    }
  })
}

export const removeSourceExcerptParaphraseIds = (
  sourceExcerptParaphrase: SourceExcerptParaphrase<SourceExcerpt>
) => {
  delete sourceExcerptParaphrase.id
  delete sourceExcerptParaphrase.sourceExcerpt.entity.id
  switch (sourceExcerptParaphrase.sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      delete sourceExcerptParaphrase.sourceExcerpt.entity.writ.id
      break
    case SourceExcerptTypes.PIC_REGION:
      delete sourceExcerptParaphrase.sourceExcerpt.entity.pic.id
      break
    case SourceExcerptTypes.VID_SEGMENT:
      delete sourceExcerptParaphrase.sourceExcerpt.entity.vid.id
      break
    default:
      throw newExhaustedEnumError('SourceExcerptTypes', sourceExcerptParaphrase.sourceExcerpt)
  }
}


export interface SourceExcerptViewModel extends Entity {
  writQuote?: WritQuote;
  picRegion?: PicRegion;
  vidSegment?: VidSegment;
}

interface NewJustificationBasisViewModel {
  type: JustificationBasisType
  propositionCompound?: PropositionCompound
  writQuote?: WritQuote
  justificationBasisCompound?: JustificationBasisCompound
}

/** A viewmodel for creating a new justification.
 *
 * Supports edits to alternative bases at the same time (whereas a materialized Justification can
 * have just one basis type.)
 */
export interface NewJustificationViewModel {
  target: JustificationTarget;
  polarity: JustificationPolarity;
  basis: NewJustificationBasisViewModel;
  rootTarget: JustificationRootTarget;
  rootTargetType: JustificationRootTargetType;
  rootPolarity: JustificationRootPolarity;
}

export const consolidateNewJustificationEntities = (newJustification: NewJustificationViewModel): Justification => {
  const basis = translateViewModelEntity(newJustification.basis)
  const justification: Justification = assign(cloneDeep(newJustification), {basis})
  return justification
}

const translateViewModelEntity = (basis: NewJustificationBasisViewModel): JustificationBasis {
  switch (basis.type) {
    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      if (!basis.propositionCompound) {
        throw newImpossibleError("propositionCompound was missing for newJustiication having type PROPOSITION_COMPOUND")
      }
      return {
        type: "PROPOSITION_COMPOUND",
        entity: basis.propositionCompound,
      }
      break
    case JustificationBasisTypes.WRIT_QUOTE:
      if (!basis.writQuote) {
        throw newImpossibleError("writQuote was missing for newJustiication having type PROPOSITION_COMPOUND")
      }
      return {
        type: "WRIT_QUOTE",
        entity: basis.writQuote,
      }
      break
    case JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND:
      if (!basis.justificationBasisCompound) {
        throw newImpossibleError("justificationBasisCompound was missing for newJustiication having type PROPOSITION_COMPOUND")
      }
      return {
        type: "JUSTIFICATION_BASIS_COMPOUND",
        entity: consolidateNewJustificationBasisCompoundEntities(basis.justificationBasisCompound),
      }
      break
    default:
      throw newExhaustedEnumError('JustificationBasisTypes', basis.type)
  }
}

export function consolidateNewJustificationBasisCompoundEntities(newJustificationBasisCompound) {
  const justificationBasisCompound = cloneDeep(newJustificationBasisCompound)
  justificationBasisCompound.atoms = map(justificationBasisCompound.atoms, atom => {
    switch (atom.type) {
      case JustificationBasisCompoundAtomTypes.PROPOSITION:
        atom.entity = atom.proposition
        break
      case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE:
        atom.entity = consolidateNewSourceExcerptParaphraseEntities(atom.sourceExcerptParaphrase)
        break
    }
    delete atom.proposition
    delete atom.sourceExcerptParaphrase

    return atom
  })

  return justificationBasisCompound
}

export function consolidateNewSourceExcerptParaphraseEntities(newSourceExcerptParaphrase) {
  const sourceExcerptParaphrase = cloneDeep(newSourceExcerptParaphrase)
  const sourceExcerpt = sourceExcerptParaphrase.sourceExcerpt
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      sourceExcerpt.entity = sourceExcerpt.writQuote
      break
    case SourceExcerptTypes.PIC_REGION:
      sourceExcerpt.entity = sourceExcerpt.picRegion
      break
    case SourceExcerptTypes.VID_SEGMENT:
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
  if (errors.version !== 1) {
    return null
  }

  const newJustificationErrors = cloneDeep(errors)
  const basisFieldErrors = newJustificationErrors.fieldErrors.basis.fieldErrors
  switch (newJustification.basis.type) {
    case JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND: {
      basisFieldErrors.justificationBasisCompound = errors.fieldErrors.basis.fieldErrors.entity
      const atomItemErrors = get(basisFieldErrors, 'justificationBasisCompound.fieldErrors.atoms.itemErrors')
      forEach(atomItemErrors, (itemErrors, i) => {
        const atom = newJustification.basis.justificationBasisCompound.atoms[i]
        switch (atom.type) {
          case JustificationBasisCompoundAtomTypes.PROPOSITION:
            itemErrors.fieldErrors.proposition = itemErrors.fieldErrors.entity
            break
          case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE: {
            itemErrors.fieldErrors.sourceExcerptParaphrase = itemErrors.fieldErrors.entity
            const sourceExcerptFieldErrors = itemErrors.fieldErrors.sourceExcerptParaphrase.fieldErrors.sourceExcerpt.fieldErrors
            switch (atom.sourceExcerptParaphrase.sourceExcerpt.type) {
              case SourceExcerptTypes.WRIT_QUOTE:
                sourceExcerptFieldErrors.writQuote = sourceExcerptFieldErrors.entity
                break
              case SourceExcerptTypes.PIC_REGION:
                sourceExcerptFieldErrors.picRegion = sourceExcerptFieldErrors.entity
                break
              case SourceExcerptTypes.VID_SEGMENT:
                sourceExcerptFieldErrors.vidSegment = sourceExcerptFieldErrors.entity
                break
              default:
                throw newExhaustedEnumError('SourceExcerptTypes', atom.sourceExcerptParaphrase.sourceExcerpt.type)
            }
            break
          }
          default:
            throw newExhaustedEnumError('JustificationBasisCompoundAtomTypes', atom.type)
        }
      })
      break
    }
    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      basisFieldErrors.propositionCompound = errors.fieldErrors.basis.fieldErrors.entity
      break
    case JustificationBasisTypes.WRIT_QUOTE:
      basisFieldErrors.writQuote = errors.fieldErrors.basis.fieldErrors.entity
      break
    default:
      throw newExhaustedEnumError('JustificationBasisTypes', newJustification.basis.type)
  }

  return newJustificationErrors
}


const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: characters.ellipsis,
  separator: /[,.]*\s+/,
}
export const isTextLong = (text) => text ? text.length > config.ui.shortTextLength : false
export const truncateWritQuoteText = (quoteText, options) => truncate(quoteText, assign({}, truncateOptions, options))


export function sourceExcerptDescription(sourceExcerpt) {
  return lowerCase(sourceExcerpt.type)
}

export function sourceExcerptIconName(sourceExcerpt: SourceExcerptViewModel) {
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      return "format_quote"
    case SourceExcerptTypes.PIC_REGION:
      return "photo"
    case SourceExcerptTypes.VID_SEGMENT:
      return "videocam"
    default:
      throw newExhaustedEnumError('SourceExcerptTypes', sourceExcerpt.type)
  }
}

export function sourceExcerptSourceDescription(sourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      return "writ"
    case SourceExcerptTypes.PIC_REGION:
      return "pic"
    case SourceExcerptTypes.VID_SEGMENT:
      return "vid"
    default:
      throw newExhaustedEnumError('SourceExcerptTypes', sourceExcerpt.type)
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

export function combineEditorIds(...editorIds) {
  return join(editorIds, '_')
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

export const contextTrailTypeByShortcut = {
  p: JustificationTargetTypes.PROPOSITION,
  s: JustificationTargetTypes.STATEMENT,
}

export const contextTrailShortcutByType = invert(contextTrailTypeByShortcut)

export const rootTargetNormalizationSchemasByType = {
  [JustificationRootTargetTypes.PROPOSITION]: propositionSchema,
  [JustificationRootTargetTypes.STATEMENT]: statementSchema,
}

export function describeRootTarget(rootTargetType, rootTarget) {
  switch(rootTargetType) {
    case JustificationRootTargetTypes.PROPOSITION:
      return rootTarget.text
    case JustificationRootTargetTypes.STATEMENT: {
      const descriptionParts = []
      let currSentence = rootTarget
      while (currSentence.sentenceType) {
        descriptionParts.push(`${currSentence.speaker.name} said that`)
        currSentence = currSentence.sentence
      }
      descriptionParts.push(`${characters.leftDoubleQuote}${currSentence.text}${characters.rightDoubleQuote}`)
      return join(descriptionParts, " ")
    }
    default:
      throw newExhaustedEnumError('JustificationRootTargetTypes', rootTargetType)
  }
}
