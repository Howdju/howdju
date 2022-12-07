import assign from "lodash/assign";
import camelCase from "lodash/camelCase";
import cloneDeep from "lodash/cloneDeep";
import drop from "lodash/drop";
import dropWhile from "lodash/dropWhile";
import flatMap from "lodash/flatMap";
import forEach from "lodash/forEach";
import head from "lodash/head";
import invert from "lodash/invert";
import join from "lodash/join";
import kebabCase from "lodash/kebabCase";
import lowerCase from "lodash/lowerCase";
import map from "lodash/map";
import split from "lodash/split";
import truncate from "lodash/truncate";
import { clone, reverse, TruncateOptions } from "lodash";

import config from "./config";
import {
  BespokeValidationErrors,
  SourceExcerpt,
  isFalsey,
  JustificationRootTarget,
  JustificationRootTargetType,
  newExhaustedEnumError,
  Proposition,
  PropositionCompound,
  WritQuote,
  newUnimplementedError,
  EntityId,
  CreateJustificationInput,
  Sentence,
  CreatePersorgInput,
  CreatePropositionInput,
  makeStatement,
  SentenceTypes,
} from "howdju-common";

import * as characters from "./characters";
import { propositionSchema, statementSchema } from "./normalizationSchemas";
import { ComponentId, ComponentName, EditorId, SuggestionsKey } from "./types";
import { schema } from "normalizr";

export const removePropositionCompoundIds = (
  propositionCompound: PropositionCompound
) => {
  if (!propositionCompound) return propositionCompound;
  delete propositionCompound.id;

  forEach(propositionCompound.atoms, (atom) => {
    removePropositionIds(atom.entity);
  });
  return propositionCompound;
};

export const removePropositionIds = (proposition: Proposition) => {
  delete proposition.id;
  return proposition;
};

export const removeWritQuoteIds = (writQuote: WritQuote) => {
  delete writQuote.id;
  delete writQuote.writ.id;
  return writQuote;
};

export const removeSourceExcerptIds = (sourceExcerpt: SourceExcerpt) => {
  delete sourceExcerpt.id;
  delete sourceExcerpt.entity.id;
  switch (sourceExcerpt.type) {
    case "WRIT_QUOTE":
      delete sourceExcerpt.entity.writ.id;
      break;
    case "PIC_REGION":
      delete sourceExcerpt.entity.pic.id;
      break;
    case "VID_SEGMENT":
      delete sourceExcerpt.entity.vid.id;
      break;
    default:
      throw newExhaustedEnumError(sourceExcerpt);
  }
};

/** Return a Statement with speakers stating the proposition */
export function constructStatement(
  speakers: CreatePersorgInput[],
  proposition: CreatePropositionInput
) {
  // In the UI the speakers are listed so that the last one is the one to say the proposition directly,
  // but we need to build the statements outward so that we have the target of the next statement.
  // So take them in reverse order
  speakers = reverse(clone(speakers));
  let statement = makeStatement({
    speaker: speakers[0],
    sentenceType: SentenceTypes.PROPOSITION,
    sentence: proposition,
  });
  for (const speaker of drop(speakers, 1)) {
    statement = makeStatement({
      speaker,
      sentenceType: SentenceTypes.STATEMENT,
      sentence: statement,
    });
  }
  return statement;
}

// TODO(26): the createJustification route currently returns a Joi error, whereas this function
// expects a BespokeValidationErrors.
export function translateCreateJustificationErrorsToInput(
  justification: CreateJustificationInput,
  errors: BespokeValidationErrors
) {
  if (!justification || !errors) {
    return errors;
  }

  const basisFieldErrors = errors.fieldErrors.basis.fieldErrors;
  if (!basisFieldErrors) {
    return errors;
  }

  const justificationErrors = cloneDeep(errors);
  switch (justification.basis.type) {
    case "PROPOSITION_COMPOUND":
      basisFieldErrors.propositionCompound = basisFieldErrors.entity;
      break;
    case "WRIT_QUOTE":
      basisFieldErrors.writQuote = basisFieldErrors.entity;
      break;
    case "SOURCE_EXCERPT":
      basisFieldErrors.sourceExcerpt = basisFieldErrors.entity;
      break;
    case "JUSTIFICATION_BASIS_COMPOUND":
      throw newUnimplementedError(
        `Unsupported basis type: ${justification.basis.type}`
      );
    default:
      throw newExhaustedEnumError(justification.basis.type);
  }

  return justificationErrors;
}

const truncateOptions = {
  length: config.ui.shortTextLength,
  omission: characters.ellipsis,
  separator: /[,.]*\s+/,
};
export const isTextLong = (text: string) =>
  text ? text.length > config.ui.shortTextLength : false;
export const truncateWritQuoteText = (
  quoteText: string,
  options: TruncateOptions
) => truncate(quoteText, assign({}, truncateOptions, options));

export function sourceExcerptDescription(sourceExcerpt: SourceExcerpt) {
  return lowerCase(sourceExcerpt.type);
}

export function sourceExcerptIconName(sourceExcerpt: SourceExcerpt) {
  switch (sourceExcerpt.type) {
    case "WRIT_QUOTE":
      return "format_quote";
    case "PIC_REGION":
      return "photo";
    case "VID_SEGMENT":
      return "videocam";
    default:
      throw newExhaustedEnumError(sourceExcerpt);
  }
}

export function sourceExcerptSourceDescription(sourceExcerpt: SourceExcerpt) {
  switch (sourceExcerpt.type) {
    case "WRIT_QUOTE":
      return "writ";
    case "PIC_REGION":
      return "pic";
    case "VID_SEGMENT":
      return "vid";
    default:
      throw newExhaustedEnumError(sourceExcerpt);
  }
}

export function combineIds(...ids: ComponentId[]) {
  const idDelimiter = "--";
  // Ids aren't always passed by the parent, so filter out the initial falsey ones
  ids = dropWhile(ids, isFalsey);
  // if ids are internally using the delimiter, split them up by it
  ids = flatMap(ids, (id) => split(id, idDelimiter));
  // ensure the resulting tokens are kebab-cased
  ids = map(ids, kebabCase);
  return join(ids, idDelimiter);
}

export function combineEditorIds(...editorIds: EditorId[]) {
  return join(editorIds, "_");
}

export function combineSuggestionsKeys(...keys: SuggestionsKey[]): string {
  // If the initial suggestions key is falsy, return it to indicate no suggestions
  if (!head(keys)) {
    return "";
  }
  keys = flatMap(keys, (key) => split(key, "."));
  keys = map(keys, camelCase);
  return join(keys, ".");
}

/**
 * A data wrapper class that indicates that a value needs to be referenced as an array index
 *
 * e.g. combineNames('foo', ArrayIndex(2), 'bar') === 'foo[2].bar'
 */
export class ArrayIndex {
  index: number;
  constructor(index: number) {
    this.index = index;
  }
}
/** convenience factory for ArrayIndex */
export function array(index: number) {
  return new ArrayIndex(index);
}

export function combineNames(
  ...names: (ComponentName | ArrayIndex | undefined)[]
) {
  // Don't convert case; the names must match the object model for use with get/set
  // I think each and every name should be truthy.  How else could they be relied upon for get/set?
  const filteredNames = dropWhile(names, isFalsey);
  const firstName = head(filteredNames);
  const remainingNames = drop(filteredNames, 1);
  const remainingNamesWithConnector = map(remainingNames, (n) =>
    n instanceof ArrayIndex ? `[${n.index}]` : `.${n}`
  );
  const allNames = [firstName].concat(remainingNamesWithConnector);
  return join(allNames, "");
}

export interface ChipInfo {
  label: string;
  isAntiVoted: boolean;
  className: string;
}

export function makeChip(props: Partial<ChipInfo>): Partial<ChipInfo> {
  return cloneDeep(props);
}

export const contextTrailTypeByShortcut = {
  p: "PROPOSITION",
  s: "STATEMENT",
} as const;
export type ContextTrailShortcut = keyof typeof contextTrailTypeByShortcut;

export const contextTrailShortcutByType = invert(contextTrailTypeByShortcut);

export const rootTargetNormalizationSchemasByType: Record<
  JustificationRootTargetType,
  schema.Entity
> = {
  ["PROPOSITION"]: propositionSchema,
  ["STATEMENT"]: statementSchema,
};

export function describeRootTarget(
  rootTargetType: JustificationRootTargetType,
  rootTarget: JustificationRootTarget
) {
  // TODO(107) make JustificationRootTarget a discriminated union type and remove typecasts
  switch (rootTargetType) {
    case "PROPOSITION":
      return (rootTarget as Proposition).text;
    case "STATEMENT": {
      const descriptionParts = [];
      let currSentence = rootTarget as Sentence;
      while ("sentenceType" in currSentence) {
        descriptionParts.push(`${currSentence.speaker.name} said that`);
        currSentence = currSentence.sentence;
      }
      descriptionParts.push(
        `${characters.leftDoubleQuote}${currSentence.text}${characters.rightDoubleQuote}`
      );
      return join(descriptionParts, " ");
    }
    default:
      throw newExhaustedEnumError(rootTargetType);
  }
}

export interface RootTargetInfo {
  rootTargetType: JustificationRootTargetType;
  rootTargetId: EntityId;
}
