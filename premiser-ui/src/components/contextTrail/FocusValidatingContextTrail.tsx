import React, { useContext } from "react";

import {
  isValidTrailTarget,
  EntityId,
  FocusEntityType,
  toJson,
  TrailConnectionNode,
  ContextTrailItem,
} from "howdju-common";
import { normalizationSchemaByEntityType } from "howdju-client-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import ErrorMessages from "@/ErrorMessages";
import ContextTrail from "./ContextTrail";
import { PrimaryContextTrail } from "./PrimaryContextTrailProvider";
import { ComponentId } from "@/types";
import { logger } from "@/logger";
import { useAppEntitySelector } from "@/hooks";
import { combineIds } from "@/viewModels";

interface Props {
  focusEntityType: FocusEntityType;
  focusEntityId: EntityId;
  id: ComponentId;
  className?: string;
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

  const schema = normalizationSchemaByEntityType[focusEntityType];
  const nodeEntity = useAppEntitySelector(focusEntityId, schema);
  if (!nodeEntity) {
    return <CircularProgress id={combineIds(componentId, "progress")} />;
  }

  const trailMatchesFocus = lastConnectionsSourceMatchesFocus(
    contextTrailItems,
    {
      type: focusEntityType,
      entity: nodeEntity,
    } as TrailConnectionNode
  );

  if (isInvalid || !trailMatchesFocus) {
    return <ErrorMessages errors={["The context trail was invalid"]} />;
  }

  return (
    <ContextTrail
      id={componentId}
      trailItems={contextTrailItems}
      className={className}
    />
  );
}

function lastConnectionsSourceMatchesFocus(
  contextTrailItems: ContextTrailItem[],
  connectionNode: TrailConnectionNode
) {
  const lastTrailItem = contextTrailItems[contextTrailItems.length - 1];
  if (lastTrailItem && !isValidTrailTarget(lastTrailItem, connectionNode)) {
    const lastItemInfo = {
      type: lastTrailItem.connectingEntityType,
      id: lastTrailItem.connectingEntity.id,
    };
    logger.error(
      `Invalid context trail. Last context trail item (${toJson(
        lastItemInfo
      )}) does not match focus entity: ${toJson(connectionNode)}.`
    );
    return false;
  }
  return true;
}
