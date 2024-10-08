import assign from "lodash/assign";
import camelCase from "lodash/camelCase";
import drop from "lodash/drop";
import dropWhile from "lodash/dropWhile";
import flatMap from "lodash/flatMap";
import head from "lodash/head";
import join from "lodash/join";
import kebabCase from "lodash/kebabCase";
import lowerCase from "lodash/lowerCase";
import map from "lodash/map";
import split from "lodash/split";
import truncate from "lodash/truncate";
import { clone, concat, isEmpty, reverse, TruncateOptions } from "lodash";

import config from "./config";
import {
  SourceExcerpt,
  isFalsey,
  JustificationRootTargetType,
  newExhaustedEnumError,
  EntityId,
  CreatePersorgInput,
  CreatePropositionInput,
  SentenceTypes,
  CreateStatementInput,
  PropositionOut,
  SentenceOut,
  StatementOut,
  ContextTrailItem,
  nextContextTrailItem,
  isNegative,
  Justification,
  JustificationOut,
  JustificationView,
  ConnectingEntityInfo,
  Entity,
  AppearanceView,
  newProgrammingError,
} from "howdju-common";
import { SuggestionsKey } from "howdju-client-common";

import * as characters from "./characters";
import { ComponentId, ComponentName, EditorId } from "./types";

/** Return a Statement with speakers stating the proposition */
export function constructStatementInput(
  speakers: CreatePersorgInput[],
  proposition: CreatePropositionInput
): CreateStatementInput {
  // In the UI the speakers are listed so that the last one is the one to say the proposition directly,
  // but we need to build the statements outward so that we have the target of the next statement.
  // So take them in reverse order
  speakers = reverse(clone(speakers));
  let statement: CreateStatementInput = {
    speaker: speakers[0],
    sentenceType: SentenceTypes.PROPOSITION,
    sentence: proposition,
  };
  for (const speaker of drop(speakers, 1)) {
    statement = {
      speaker,
      sentenceType: SentenceTypes.STATEMENT,
      sentence: statement,
    };
  }
  return statement;
}

const defaultTruncateOptions = {
  length: config.ui.shortTextLength,
  omission: characters.ellipsis,
  separator: /[,.]*\s+/,
};
export const isTextLong = (text: string) =>
  text ? text.length > config.ui.shortTextLength : false;
export const truncateWritQuoteText = (
  quoteText: string,
  options: TruncateOptions
) => truncate(quoteText, assign({}, defaultTruncateOptions, options));
export function truncateText(
  text: string | undefined,
  options: TruncateOptions
) {
  return truncate(text, assign({}, defaultTruncateOptions, options));
}

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

export function combineIds(...ids: (ComponentId | number)[]) {
  const idDelimiter = "--";
  let idStrings = map(ids, (id) => `${id}`);
  // Ids aren't always passed by the parent, so filter out the initial falsey ones
  idStrings = dropWhile(idStrings, isFalsey);
  // if ids are internally using the delimiter, split them up by it
  idStrings = flatMap(idStrings, (id) => split(`${id}`, idDelimiter));
  // ensure the resulting tokens are kebab-cased
  idStrings = idStrings.map(kebabCase);
  return join(idStrings, idDelimiter);
}

/** Create a default editor ID. */
export function defaultEditorId(id: ComponentId) {
  return combineEditorIds(id, "-editor");
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

export function combineObjectKey(key: string, extra: string) {
  return key + "." + extra;
}

export function combineNames(
  ...names: (ComponentName | ArrayIndex | undefined)[]
) {
  // Don't convert case; the names must match the object model for use with get/set
  // I think each and every name should be truthy.  How else could they be relied upon for get/set?
  const filteredNames = dropWhile(names, isFalsey);
  const [firstName, ...remainingNames] = filteredNames;
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

export function describeRootTarget(
  rootTargetType: "PROPOSITION",
  rootTarget: PropositionOut
): string;
export function describeRootTarget(
  rootTargetType: "STATEMENT",
  rootTarget: StatementOut
): string;
export function describeRootTarget(
  rootTargetType: JustificationRootTargetType,
  rootTarget: PropositionOut | StatementOut
): string;
export function describeRootTarget(
  rootTargetType: JustificationRootTargetType,
  rootTarget: PropositionOut | StatementOut
) {
  // TODO(107) make JustificationRootTarget a discriminated union type and remove typecasts
  switch (rootTargetType) {
    case "PROPOSITION":
      return (rootTarget as PropositionOut).text;
    case "STATEMENT": {
      const descriptionParts = [];
      let currSentence: SentenceOut = rootTarget as StatementOut;
      while ("speaker" in currSentence) {
        descriptionParts.push(`${currSentence.speaker.name} said that`);
        currSentence = currSentence.sentence as SentenceOut;
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

export function makeContextTrailItems(
  contextTrailItems: ContextTrailItem[] | undefined,
  connectingEntityInfo: ConnectingEntityInfo
) {
  if (contextTrailItems && !isEmpty(contextTrailItems)) {
    return extendContextTrailItems(contextTrailItems, connectingEntityInfo);
  }
  const { connectingEntityType, connectingEntity } = connectingEntityInfo;
  switch (connectingEntityType) {
    case "JUSTIFICATION":
      return extendContextTrailItems([], connectingEntityInfo);
    case "APPEARANCE":
      return startContextTrailFromAppearance(connectingEntity);
    default:
      throw newProgrammingError(
        `Unsupported connectingEntityType for initial context trail: ${connectingEntityType}`
      );
  }
}

function extendContextTrailItems(
  contextTrailItems: ContextTrailItem[],
  connectingEntityInfo: ConnectingEntityInfo
): ContextTrailItem[] {
  const trailItem = nextContextTrailItem(
    connectingEntityInfo,
    contextTrailItems[contextTrailItems.length - 1]?.polarity
  );
  return concat(contextTrailItems, [trailItem]);
}

function startContextTrailFromAppearance(
  appearance: AppearanceView
): ContextTrailItem[] {
  return [
    {
      connectingEntityId: appearance.id,
      polarity: "NEUTRAL",
      connectingEntityType: "APPEARANCE",
      connectingEntity: appearance,
    },
  ];
}

/** Information sufficient to reference a proposition in the UI. */
export interface PropositionRefView extends Entity {
  /** A slugified version of the proposition text. */
  slug?: string;
}

// If a justification targets another justification, its polarity should always be negative
export function isCounter<
  J extends Justification | JustificationOut | JustificationView
>(
  j: J
): j is J & {
  target: { type: "JUSTIFICATION" };
  polarity: "NEGATIVE";
} {
  return j.target.type === "JUSTIFICATION" && isNegative(j);
}
