import { invert, join, map, some, split } from "lodash";

import {
  EntityId,
  RelationPolarity,
  logger,
  JustificationView,
  AppearanceView,
} from "howdju-common";

import {
  AppearanceOut,
  JustificationOut,
  JustificationWithRootOut,
  PropositionOut,
  StatementOut,
} from "./apiModels";

/**
 * A representation of an item in a context trail sufficient to request the full information.
 *
 * These infos are included in URLs, and then the client must request the details of the connecting
 * entity to fill in details about its target.
 */
export interface ContextTrailItemInfo {
  connectingEntityType: "JUSTIFICATION" | "APPEARANCE";
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
} & (
  | {
      connectingEntityType: "JUSTIFICATION";
      connectingEntity: JustificationView;
    }
  | {
      connectingEntityType: "APPEARANCE";
      connectingEntity: AppearanceView;
    }
);
export type ContextTrailItemOut = {
  connectingEntityId: EntityId;
  polarity: RelationPolarity;
} & (
  | {
      connectingEntityType: "JUSTIFICATION";
      connectingEntity: JustificationWithRootOut;
    }
  | {
      connectingEntityType: "APPEARANCE";
      connectingEntity: AppearanceOut;
    }
);

/**
 * A client-only type-safe wrapper for a connecting entity type and entity.
 *
 * It helps the type system ensure that the type matches the entity.
 */
export type ConnectingEntityInfo =
  | {
      connectingEntityType: "JUSTIFICATION";
      connectingEntity: JustificationView;
    }
  | { connectingEntityType: "APPEARANCE"; connectingEntity: AppearanceView };

/**
 * A cross-plat type-safe wrapper for a connecting entity type and entity.
 *
 * It helps the type system ensure that the type matches the entity.
 */
export type TrailConnection =
  | {
      connectingEntityType: "JUSTIFICATION";
      connectingEntity: JustificationWithRootOut | JustificationView;
    }
  | {
      connectingEntityType: "APPEARANCE";
      connectingEntity: AppearanceOut | AppearanceView;
    };

export type ConnectingEntityOut = ContextTrailItemOut["connectingEntity"];
export type ConnectingEntity = ContextTrailItem["connectingEntity"];
export type ConnectingEntityType = ContextTrailItem["connectingEntityType"];
// For now just reuse JustificationRootTargetType, but we will need to union with Appearance targets too.
const focusEntityTypes = ["PROPOSITION", "STATEMENT", "APPEARANCE"] as const;
export type FocusEntityType = typeof focusEntityTypes[number];

export const contextTrailTypeByShortcut = {
  j: "JUSTIFICATION",
  a: "APPEARANCE",
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

export type TrailConnectionNode =
  | {
      type: "JUSTIFICATION";
      entity: JustificationOut | JustificationWithRootOut | JustificationView;
    }
  | {
      type: "PROPOSITION";
      entity: PropositionOut;
    }
  | {
      type: "STATEMENT";
      entity: StatementOut;
    }
  | {
      type: "APPEARANCE";
      entity: AppearanceOut;
    };

/** `prev` is the previous entity in the chain. Usually this is displayed above the current (`curr`) one. */
export function areAdjacentConnectingEntities(
  prev: TrailConnection,
  curr: TrailConnection
) {
  switch (curr.connectingEntityType) {
    case "JUSTIFICATION": {
      return isValidTrailTarget(prev, curr.connectingEntity.target);
    }
    case "APPEARANCE": {
      // Prev can be:
      // - a proposition-compound-based justification in which case this
      //   Appearance must connect to one of the atoms in the proposition compound.
      // - or a MediaExcerpt-based justification, in which case this Appearance must
      //   connect to the same media-excerpt.
      switch (prev.connectingEntityType) {
        case "APPEARANCE":
          // Appearances can't connect to each other.
          return false;
        case "JUSTIFICATION":
          switch (prev.connectingEntity.basis.type) {
            case "PROPOSITION_COMPOUND":
              if (curr.connectingEntity.apparition.type !== "PROPOSITION") {
                return false;
              }
              return some(
                prev.connectingEntity.basis.entity.atoms,
                (a) =>
                  a.entity.id === curr.connectingEntity.apparition.entity.id
              );
            case "MEDIA_EXCERPT":
              return (
                curr.connectingEntity.mediaExcerpt.id ===
                prev.connectingEntity.basis.entity.id
              );
            case "WRIT_QUOTE":
              // WritQuotes are deprecated and Appearances don't interfact with them.
              return false;
          }
      }
    }
  }
}

/**
 * Returns true iff the given connection is valid for the given target.
 * @param connection The connection leading to the target.
 * @param target The target the trail ends in.
 */
export function isValidTrailTarget(
  connection: TrailConnection,
  { type, entity }: TrailConnectionNode
) {
  switch (type) {
    case "JUSTIFICATION": {
      return (
        connection.connectingEntityType === "JUSTIFICATION" &&
        entity.id === connection.connectingEntity.id
      );
    }
    case "PROPOSITION":
      switch (connection.connectingEntityType) {
        case "JUSTIFICATION":
          switch (connection.connectingEntity.basis.type) {
            case "PROPOSITION_COMPOUND":
              return some(
                connection.connectingEntity.basis.entity.atoms,
                (a) => a.entity.id === entity.id
              );
            case "WRIT_QUOTE":
            case "MEDIA_EXCERPT":
              return false;
          }
        case "APPEARANCE":
          return connection.connectingEntity.apparition.entity.id === entity.id;
      }
    case "STATEMENT":
      // Statements currently cannot appear in a context trail chain because they cannot
      // be the basis of a Justification.
      return false;
    case "APPEARANCE":
      switch (connection.connectingEntityType) {
        case "JUSTIFICATION":
          switch (connection.connectingEntity.basis.type) {
            case "PROPOSITION_COMPOUND":
              return (
                entity.apparition.type === "PROPOSITION" &&
                some(
                  connection.connectingEntity.basis.entity.atoms,
                  (a) => a.entity.id === entity.apparition.entity.id
                )
              );
            case "WRIT_QUOTE":
              return false;
            case "MEDIA_EXCERPT":
              return (
                connection.connectingEntity.basis.entity.id ===
                entity.mediaExcerpt.id
              );
          }
        case "APPEARANCE":
          return false;
      }
  }
}

export function nextContextTrailItem(
  connectingEntityInfo: ConnectingEntityInfo,
  prevItemPolarity: RelationPolarity
): ContextTrailItem {
  const polarity = contextTrailItemPolarity(
    connectingEntityInfo,
    prevItemPolarity
  );
  return {
    ...connectingEntityInfo,
    connectingEntityId: connectingEntityInfo.connectingEntity.id,
    polarity,
  };
}

export function contextTrailItemPolarity(
  connectingEntityInfo: TrailConnection,
  prevItemPolarity: RelationPolarity
) {
  switch (connectingEntityInfo.connectingEntityType) {
    case "JUSTIFICATION": {
      switch (connectingEntityInfo.connectingEntity.target.type) {
        case "PROPOSITION":
        case "STATEMENT":
          return connectingEntityInfo.connectingEntity.polarity;
        case "JUSTIFICATION":
          // Counter justifications should have the opposite polarity as their target
          return negateRelationPolarity(prevItemPolarity);
      }
      break;
    }
    case "APPEARANCE":
      return "POSITIVE";
  }
}

function negateRelationPolarity(polarity: RelationPolarity) {
  switch (polarity) {
    case "POSITIVE":
      return "NEGATIVE";
    case "NEGATIVE":
      return "POSITIVE";
    case "NEUTRAL":
      return "NEUTRAL";
  }
}
