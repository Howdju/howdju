import React from "react";

import { AppearanceView, ContextTrailItem } from "howdju-common";

import CreationInfo from "@/components/creationInfo/CreationInfo";
import { combineIds, makeContextTrailItems } from "@/viewModels";
import PropositionEntityViewer from "@/PropositionEntityViewer";
import MediaExcerptEntityViewer from "@/components/mediaExcerpts/MediaExcerptEntityViewer";

import "./AppearanceViewer.scss";

interface Props {
  id: string;
  appearance: AppearanceView;
  contextTrailItems?: ContextTrailItem[];
  mode?: "CONTEXT_TRAIL" | "TOP_LEVEL";
}

export default function AppearanceViewer({
  id,
  appearance,
  contextTrailItems,
  mode = "TOP_LEVEL",
}: Props) {
  const nextContextTrailItems = makeContextTrailItems(contextTrailItems, {
    connectingEntityType: "APPEARANCE",
    connectingEntity: appearance,
  });
  if (mode === "CONTEXT_TRAIL") {
    return (
      <div className="appearance-viewer">
        <MediaExcerptEntityViewer
          id={combineIds(id, "media-excerpt-viewer")}
          mediaExcerpt={appearance.mediaExcerpt}
          contextTrailItems={nextContextTrailItems}
        />
        <CreationInfo
          created={appearance.created}
          creator={appearance.creator}
        />
      </div>
    );
  }
  return (
    <div className="appearance-viewer">
      <PropositionEntityViewer
        id={combineIds(id, "proposition-viewer")}
        proposition={appearance.apparition.entity}
        contextTrailItems={nextContextTrailItems}
      />
      <p>appears in</p>
      <MediaExcerptEntityViewer
        id={combineIds(id, "media-excerpt-viewer")}
        mediaExcerpt={appearance.mediaExcerpt}
        contextTrailItems={nextContextTrailItems}
      />
      <CreationInfo created={appearance.created} creator={appearance.creator} />
    </div>
  );
}
