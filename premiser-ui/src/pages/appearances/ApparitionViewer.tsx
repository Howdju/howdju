import React from "react";

import { AppearanceView, ContextTrailItem, EntityId } from "howdju-common";

import { logger } from "@/logger";
import PropositionEntityViewer from "@/PropositionEntityViewer";
import { makeContextTrailItems } from "@/viewModels";

interface Props {
  id: EntityId;
  appearance: AppearanceView;
  contextTrailItems?: ContextTrailItem[];
}

/**
 * Component for viewing the apparition of an appearance. This is useful on
 * a page dedicated to the MediaExcerpt, since this component will not duplicate
 * the MediaExcerpt information.
 */
export default function ApparitionViewer({
  id,
  appearance,
  contextTrailItems,
}: Props) {
  const nextContextTrailItems = makeContextTrailItems(contextTrailItems, {
    connectingEntityType: "APPEARANCE",
    connectingEntity: appearance,
  });
  switch (appearance.apparition.type) {
    case "PROPOSITION":
      return (
        <PropositionEntityViewer
          id={id}
          proposition={appearance.apparition.entity}
          contextTrailItems={nextContextTrailItems}
        />
      );
    default:
      logger.error(
        `"Unknown apparition type for ApparitionViewer ${appearance.apparition.type}`
      );
      return <div>Unknown apparition type</div>;
  }
}
