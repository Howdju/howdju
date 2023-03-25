import React, { useContext } from "react";

import {
  areValidTargetAndConnectingEntity,
  EntityId,
  FocusEntityType,
  toJson,
} from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import ContextTrail from "./ContextTrail";
import { PrimaryContextTrail } from "./PrimaryContextTrailProvider";
import { ComponentId } from "@/types";
import { logger } from "@/logger";

interface Props {
  focusEntityType: FocusEntityType;
  focusEntityId: EntityId;
  id: ComponentId;
  className: string;
}
/**
 * A ContextTrail wrapper that validates that some focus entity matches the context trail.
 *
 * The focus entity type and ID must match those of the last context trail item.
 */
export default function FocusValidatingContextTrail({
  focusEntityType,
  focusEntityId,
  id: componentId,
  className,
}: Props) {
  const { contextTrailItems, isInvalid } = useContext(PrimaryContextTrail);

  function lastConnectionsSourceMatchesFocus() {
    const lastTrailEntity = contextTrailItems[contextTrailItems.length - 1];
    const focusInfo = { type: focusEntityType, id: focusEntityId };
    if (
      lastTrailEntity &&
      !areValidTargetAndConnectingEntity(focusInfo, {
        type: lastTrailEntity.connectingEntityType,
        entity: lastTrailEntity.connectingEntity,
      })
    ) {
      const lastItemInfo = {
        type: lastTrailEntity.connectingEntityType,
        id: lastTrailEntity.connectingEntity.id,
      };
      logger.error(
        `Invalid context trail. Last context trail item (${toJson(
          lastItemInfo
        )}) does not match focus entity: ${toJson(focusInfo)}.`
      );
      return false;
    }
    return true;
  }

  const trailMatchesFocus = lastConnectionsSourceMatchesFocus();

  return isInvalid || !trailMatchesFocus ? (
    <ErrorMessages errors={["The context trail was invalid"]} />
  ) : (
    <ContextTrail
      id={componentId}
      trailItems={contextTrailItems}
      className={className}
    />
  );
}
