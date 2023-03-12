import { invert, join, map, split } from "lodash";
import { JustificationOut } from "./apiModels";

import { EntityId } from "./entities";
import { logger } from "./logger";
import { RelationPolarity } from "./zodSchemas";

/**
 * A representation of an item in a context trail sufficient to request the full information.
 *
 * These infos are included in URLs, and then the client must request the details of the connecting
 * entity to fill in details about its target.
 */
export interface ContextTrailItemInfo {
  connectingEntityType: "JUSTIFICATION";
  connectingEntityId: EntityId;
  polarity: RelationPolarity;
}

/**
 * An item in a context trail sufficient to display the context trail item.
 *
 * A connecting Entity defines a primary relationship between other entities.
 *
 * A primary relationship is one that serves Howdju's primary goals of presenting and critiquing
 * argument, such as Justification and Appearance.
 *
 * Connecting Entities are distinct from Relationships, which term we plan to use as an umbrella for
 * entities that create secondary, or curatorial relationships between primary Entities. For example
 * a PropositionRelation of type Equivilent indicates that two propositions are semantically
 * equivalent. This secondary relation will help Howdju to curate the primary Proposition content.
 */
export type ContextTrailItem = {
  connectingEntityId: EntityId;
  polarity: RelationPolarity;
} & {
  connectingEntityType: "JUSTIFICATION";
  connectingEntity: JustificationOut;
};

export type ConnectingEntity = ContextTrailItem["connectingEntity"];
export type ConnectingEntityType = ContextTrailItem["connectingEntityType"];
// For now just reuse JustificationRootTargetType, but we will need to union with Appearance targets too.
const focusEntityTypes = ["PROPOSITION", "STATEMENT"] as const;
export type FocusEntityType = typeof focusEntityTypes[number];
const focusEntityTypesSet = new Set(focusEntityTypes);

export function isFocusEntityType(
  val: string | undefined
): val is FocusEntityType {
  return focusEntityTypesSet.has(val as any);
}

export const contextTrailTypeByShortcut = {
  j: "JUSTIFICATION",
} as const;
export type ContextTrailTypeShortcut = keyof typeof contextTrailTypeByShortcut;

export const contextTrailPolarityByShortcut = {
  p: "POSITIVE",
  n: "NEGATIVE",
  u: "NEUTRAL",
} as const;
export type ContextTrailPolarityShortcut =
  keyof typeof contextTrailPolarityByShortcut;

export const contextTrailShortcutByType = invert(contextTrailTypeByShortcut);

export function serializeContextTrail(
  contextTrailItems: (ContextTrailItem | ContextTrailItemInfo)[]
): string {
  const serializedItems = map(contextTrailItems, (i) =>
    join(
      [
        contextTrailShortcutByType[i.connectingEntityType],
        i.connectingEntityId,
        i.polarity,
      ],
      ","
    )
  );
  return join(serializedItems, ";");
}

export type ContextTrailInfoParseResult = {
  // The infos that were successfully parsed
  infos: ContextTrailItemInfo[];
  // The infos that could not be successfully parsed
  invalidInfos: string[];
};

export function parseContextTrail(
  serializedContextTrail: string
): ContextTrailInfoParseResult {
  const infoStrings = split(serializedContextTrail, ";");
  const infos = [];
  const invalidInfos = [];
  for (const infoString of infoStrings) {
    const [typeShortcut, connectingEntityId, polarityShortcut] = split(
      infoString,
      ","
    );
    if (!(typeShortcut in contextTrailTypeByShortcut)) {
      logger.error(
        `Invalid context trail type shortcut: ${typeShortcut} in ${serializedContextTrail}`
      );
      invalidInfos.push(infoString);
      continue;
    }
    if (!(polarityShortcut in contextTrailPolarityByShortcut)) {
      logger.error(
        `Invalid context trail polarity shortcut: ${polarityShortcut} in ${serializedContextTrail}`
      );
      invalidInfos.push(infoString);
      continue;
    }
    // casting is necessary because `k in o` does not narrow `k`
    // (see https://github.com/microsoft/TypeScript/issues/43284)
    const connectingEntityType =
      contextTrailTypeByShortcut[typeShortcut as ContextTrailTypeShortcut];
    const polarity =
      contextTrailPolarityByShortcut[
        polarityShortcut as ContextTrailPolarityShortcut
      ];
    infos.push({
      connectingEntityType,
      connectingEntityId,
      polarity,
    });
  }
  return { infos, invalidInfos };
}
