import React from "react";

import { AppearanceView, ContextTrailItem, EntityId } from "howdju-common";
import PropositionEntityViewer from "@/PropositionEntityViewer";

interface Props {
  id: EntityId;
  appearance: AppearanceView;
  contextTrailItems?: ContextTrailItem[];
}

/**
 * Component for viewing the apparition of an appearance. This is useful on
 * a page dedicated to the MediaExcerpt, since this component will not duplicate
 *  the MediaExcerpt information.
 */
export default function ApparitionViewer({
  id,
  appearance,
  contextTrailItems,
}: Props) {
  switch (appearance.apparition.type) {
    case "PROPOSITION":
      return (
        <PropositionEntityViewer
          id={id}
          proposition={appearance.apparition.entity}
          contextTrailItems={contextTrailItems}
        />
      );
    default:
      return <div>Unknown apparition type</div>;
  }
}
