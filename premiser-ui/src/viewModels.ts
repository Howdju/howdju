import assign from "lodash/assign"
import camelCase from "lodash/camelCase"
import cloneDeep from "lodash/cloneDeep"
import drop from "lodash/drop"
import dropWhile from "lodash/dropWhile"
import flatMap from "lodash/flatMap"
import forEach from "lodash/forEach"
import head from "lodash/head"
import invert from "lodash/invert"
import join from "lodash/join"
import kebabCase from "lodash/kebabCase"
import lowerCase from "lodash/lowerCase"
import map from "lodash/map"
import split from "lodash/split"
import truncate from "lodash/truncate"
import { TruncateOptions } from "lodash"

import config from "./config"
import {
  BespokeValidationErrors,
  SourceExcerpt,
  isFalsey,
  JustificationBasis,
  JustificationBasisTypes,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  newExhaustedEnumError,
  newImpossibleError,
  Proposition,
  PropositionCompound,
  SourceExcerptTypes,
  WritQuote,
  Sentence,
  newUnimplementedError,
  EntityId,
} from "howdju-common"
import {
  JustificationBasisEditModel,
  JustificationEditModel,
  JustificationSubmissionModel,
  SourceExcerptEditModel,
} from "howdju-client-common"

import * as characters from "./characters"
import { justificationSchema, propositionSchema, statementSchema } from "./normalizationSchemas"
import { ComponentId, ComponentName, EditorId, SuggestionsKey } from "./types"

export const removePropositionCompoundIds = (
  propositionCompound: PropositionCompound
) => {
  if (!propositionCompound) return propositionCompound
  delete propositionCompound.id

  forEach(propositionCompound.atoms, (atom) => {
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

export const removeSourceExcerptIds = (sourceExcerpt: SourceExcerpt) => {
  delete sourceExcerpt.id
  delete sourceExcerpt.entity.id
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      delete sourceExcerpt.entity.writ.id
      break
    case SourceExcerptTypes.PIC_REGION:
      delete sourceExcerpt.entity.pic.id
      break
    case SourceExcerptTypes.VID_SEGMENT:
      delete sourceExcerpt.entity.vid.id
      break
    default:
      throw newExhaustedEnumError(sourceExcerpt)
  }
}

export const consolidateNewJustificationEntities = (
  justificationInput: JustificationEditModel
): JustificationSubmissionModel => {
  const basis = translateBasisEditModel(justificationInput.basis)
  const justification: JustificationSubmissionModel = assign(cloneDeep(justificationInput), {
    basis,
  })
  return justification
}

const translateBasisEditModel = (
  basis: JustificationBasisEditModel
): JustificationBasis => {
  switch (basis.type) {
    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      if (!basis.propositionCompound) {
        throw newImpossibleError(
          "propositionCompound was missing for JustificationFormInput having type PROPOSITION_COMPOUND"
        )
      }
      return {
        type: "PROPOSITION_COMPOUND",
        entity: basis.propositionCompound,
      }
    case JustificationBasisTypes.WRIT_QUOTE:
      if (!basis.writQuote) {
        throw newImpossibleError(
          "writQuote was missing for JustificationFormInput having type PROPOSITION_COMPOUND"
        )
      }
      return {
        type: "WRIT_QUOTE",
        entity: basis.writQuote,
      }
    case JustificationBasisTypes.SOURCE_EXCERPT:
      if (!basis.sourceExcerpt) {
        throw newImpossibleError(
          "sourceExcerpt was missing for JustificationFormInput having type SOURCE_EXCERPT"
        )
      }
      return {
        type: "SOURCE_EXCERPT",
        entity: translateSourceExcerptEditModel(basis.sourceExcerpt),
      }
    case "JUSTIFICATION_BASIS_COMPOUND":
      throw newUnimplementedError(`Unsupported basis type: ${basis.type}`)
    default:
      throw newExhaustedEnumError(basis.type)
  }
}

export function translateSourceExcerptEditModel(
  sourceExcerpt: SourceExcerptEditModel
): SourceExcerpt {
  switch (sourceExcerpt.type) {
    case "PIC_REGION":
      if (!sourceExcerpt.picRegion) {
        throw newImpossibleError(
          "picRegion was missing for SourceExcerptEditModel having type PIC_REGION"
        )
      }
      return {
        type: "PIC_REGION",
        entity: sourceExcerpt.picRegion,
      }
    case "VID_SEGMENT":
      if (!sourceExcerpt.vidSegment) {
        throw newImpossibleError(
          "vidSegment was missing for SourceExcerptEditModel having type VID_SEGMENT"
        )
      }
      return {
        type: "VID_SEGMENT",
        entity: sourceExcerpt.vidSegment,
      }
    case "WRIT_QUOTE":
      if (!sourceExcerpt.writQuote) {
        throw newImpossibleError(
          "writQuote was missing for SourceExcerptEditModel having type WRIT_QUOTE"
        )
      }
      return {
        type: "WRIT_QUOTE",
        entity: sourceExcerpt.writQuote,
      }
    default:
      throw newExhaustedEnumError(sourceExcerpt.type)
  }
}

// TODO(26): the createJustification route currently returns a Joi error, whereas this function
// expects a BespokeValidationErrors.
export function translateJustificationErrorsFromFormInput(
  justification: JustificationEditModel,
  errors: BespokeValidationErrors
) {
  if (!justification || !errors) {
    return errors
  }

  const justificationErrors = cloneDeep(errors)
  const basisFieldErrors = justificationErrors.fieldErrors.basis.fieldErrors
  switch (justification.basis.type) {
    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      basisFieldErrors.propositionCompound =
        errors.fieldErrors.basis.fieldErrors.entity
      break
    case JustificationBasisTypes.WRIT_QUOTE:
      basisFieldErrors.writQuote = errors.fieldErrors.basis.fieldErrors.entity
      break
    case JustificationBasisTypes.SOURCE_EXCERPT:
      basisFieldErrors.sourceExcerpt =
        errors.fieldErrors.basis.fieldErrors.entity
      break
    case "JUSTIFICATION_BASIS_COMPOUND":
      throw newUnimplementedError(`Unsupported basis type: ${justification.basis.type}`)
    default:
      throw newExhaustedEnumError(justification.basis.type)
  }

  return justificationErrors
}

const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: characters.ellipsis,
  separator: /[,.]*\s+/,
}
export const isTextLong = (text: string) =>
  text ? text.length > config.ui.shortTextLength : false
export const truncateWritQuoteText = (
  quoteText: string,
  options: TruncateOptions
) => truncate(quoteText, assign({}, truncateOptions, options))

export function sourceExcerptDescription(sourceExcerpt: SourceExcerpt) {
  return lowerCase(sourceExcerpt.type)
}

export function sourceExcerptIconName(sourceExcerpt: SourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      return "format_quote"
    case SourceExcerptTypes.PIC_REGION:
      return "photo"
    case SourceExcerptTypes.VID_SEGMENT:
      return "videocam"
    default:
      throw newExhaustedEnumError(sourceExcerpt)
  }
}

export function sourceExcerptSourceDescription(sourceExcerpt: SourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      return "writ"
    case SourceExcerptTypes.PIC_REGION:
      return "pic"
    case SourceExcerptTypes.VID_SEGMENT:
      return "vid"
    default:
      throw newExhaustedEnumError(sourceExcerpt)
  }
}

export function combineIds(...ids: ComponentId[]) {
  const idDelimiter = "--"
  // Ids aren't always passed by the parent, so filter out the initial falsey ones
  ids = dropWhile(ids, isFalsey)
  // if ids are internally using the delimiter, split them up by it
  ids = flatMap(ids, (id) => split(id, idDelimiter))
  // ensure the resulting tokens are kebab-cased
  ids = map(ids, kebabCase)
  return join(ids, idDelimiter)
}

export function combineEditorIds(...editorIds: EditorId[]) {
  return join(editorIds, "_")
}

export function combineSuggestionsKeys(...keys: SuggestionsKey[]): string {
  // If the initial suggestions key is falsy, return it to indicate no suggestions
  if (!head(keys)) {
    return ''
  }
  keys = flatMap(keys, (key) => split(key, "."))
  keys = map(keys, camelCase)
  return join(keys, ".")
}

/**
 * A data wrapper class that indicates that a value needs to be referenced as an array index
 *
 * e.g. combineNames('foo', ArrayIndex(2), 'bar') === 'foo[2].bar'
 */
export class ArrayIndex {
  index: number
  constructor(index: number) {
    this.index = index
  }
}
/** convenience factory for ArrayIndex */
export function array(index: number) {
  return new ArrayIndex(index)
}

export function combineNames(...names: (ComponentName | ArrayIndex)[]) {
  // Don't convert case; the names must match the object model for use with get/set
  // I think each and every name should be truthy.  How else could they be relied upon for get/set?
  const filteredNames = dropWhile(names, isFalsey)
  const firstName = head(filteredNames)
  const remainingNames = drop(filteredNames, 1)
  const remainingNamesWithConnector = map(remainingNames, (n) =>
    n instanceof ArrayIndex ? `[${n.index}]` : `.${n}`
  )
  const allNames = [firstName].concat(remainingNamesWithConnector)
  return join(allNames, "")
}

export interface ChipInfo {
  label: string;
  isAntiVoted: boolean;
  className: string;
}

export function makeChip(props: Partial<ChipInfo>): Partial<ChipInfo> {
  return cloneDeep(props)
}



export const contextTrailTypeByShortcut = {
  p: JustificationTargetTypes.PROPOSITION,
  s: JustificationTargetTypes.STATEMENT,
} as const
export type ContextTrailShortcut = keyof typeof contextTrailTypeByShortcut

export const contextTrailShortcutByType = invert(contextTrailTypeByShortcut)

export const rootTargetNormalizationSchemasByType = {
  [JustificationRootTargetTypes.PROPOSITION]: propositionSchema,
  [JustificationRootTargetTypes.STATEMENT]: statementSchema,
  [JustificationRootTargetTypes.JUSTIFICATION]: justificationSchema,
}

export function describeRootTarget(
  rootTargetType: JustificationRootTargetType,
  rootTarget: JustificationRootTarget
) {
  // TODO(107) make JustificationRootTarget a discriminated union type and remove typecasts
  switch (rootTargetType) {
    case JustificationRootTargetTypes.PROPOSITION:
      return (rootTarget as Proposition).text
    case JustificationRootTargetTypes.STATEMENT: {
      const descriptionParts = []
      let currSentence = rootTarget as Sentence
      while ("sentenceType" in currSentence) {
        descriptionParts.push(`${currSentence.speaker.name} said that`)
        currSentence = currSentence.sentence
      }
      descriptionParts.push(
        `${characters.leftDoubleQuote}${currSentence.text}${characters.rightDoubleQuote}`
      )
      return join(descriptionParts, " ")
    }
    case JustificationRootTargetTypes.JUSTIFICATION:
      throw newUnimplementedError("Add describeRootTarget(Justification)")
    default:
      throw newExhaustedEnumError(rootTargetType)
  }
}

export interface RootTargetInfo {
  rootTargetType: JustificationRootTargetType;
  rootTargetId: EntityId;
}
