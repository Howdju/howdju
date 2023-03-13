import { invert, join, map, some, split } from "lodash";
import { JustificationOut } from "./apiModels";

import { EntityId } from "./entities";
import { logger } from "./logger";
import { JustificationTargetType, RelationPolarity } from "./zodSchemas";

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
// TODO(20): Union with Appearance target type
export type ConnectingEntityTargetType = JustificationTargetType;
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

export const contextTrailShortcutByPolarity = invert(
  contextTrailPolarityByShortcut
);
export const contextTrailShortcutByType = invert(contextTrailTypeByShortcut);

export function serializeContextTrail(
  contextTrailItems: (ContextTrailItem | ContextTrailItemInfo)[]
): string {
  const serializedItems = map(contextTrailItems, (i) =>
    join(
      [
        contextTrailShortcutByType[i.connectingEntityType],
        i.connectingEntityId,
        contextTrailShortcutByPolarity[i.polarity],
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
  // True iff invalidInfos is non-empty;
  hasInvalidInfos: boolean;
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
  return { infos, invalidInfos, hasInvalidInfos: !!invalidInfos.length };
}

// If we add ConnectingEntityTypes, expand this discriminated union.
export type TypedConnectingEntity = {
  type: "JUSTIFICATION";
  entity: JustificationOut;
};

export type TypedConnectingEntityTargetId = {
  type: ConnectingEntityTargetType;
  id: EntityId;
};

/** `prev` is the previous entity in the chain. Usually this is displayed above the current (`curr`) one. */
export function areAdjacentConnectingEntities(
  prev: TypedConnectingEntity,
  curr: TypedConnectingEntity
) {
  switch (curr.type) {
    case "JUSTIFICATION": {
      const type = curr.entity.target.type;
      const id = curr.entity.target.entity.id;
      return areValidTargetAndConnectingEntity({ type, id }, prev);
    }
  }
}

export function areValidTargetAndConnectingEntity(
  { type, id }: TypedConnectingEntityTargetId,
  prev: TypedConnectingEntity
) {
  switch (type) {
    case "JUSTIFICATION": {
      return prev.type === "JUSTIFICATION" && id === prev.entity.id;
    }
    case "PROPOSITION":
      switch (prev.type) {
        case "JUSTIFICATION":
          switch (prev.entity.basis.type) {
            case "PROPOSITION_COMPOUND":
              return some(
                prev.entity.basis.entity.atoms,
                (a) => a.entity.id === id
              );
            case "SOURCE_EXCERPT":
            case "WRIT_QUOTE":
              return false;
          }
      }
    case "STATEMENT":
      // Statements currently cannot appear in a context trail chain because they cannot
      // be the basis of a Justification.
      return false;
  }
}

export function getConnectingEntitySourceInfo(
  typedConnectingEntity: TypedConnectingEntity
) {
  switch (typedConnectingEntity.type) {
    case "JUSTIFICATION":
      return {
        id: typedConnectingEntity.entity.basis.entity.id,
        type: typedConnectingEntity.entity.basis.type,
      };
  }
}
