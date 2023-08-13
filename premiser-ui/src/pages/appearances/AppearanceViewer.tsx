import React from "react";

import { AppearanceView } from "howdju-common";

import CreationInfo from "@/components/creationInfo/CreationInfo";
import { combineIds } from "@/viewModels";
import PropositionEntityViewer from "@/PropositionEntityViewer";
import MediaExcerptEntityViewer from "@/components/mediaExcerpts/MediaExcerptEntityViewer";

import "./AppearanceViewer.scss";

interface Props {
  id: string;
  appearance: AppearanceView;
}

export default function AppearanceViewer({ id, appearance }: Props) {
  return (
    <div className="appearance-viewer">
      <PropositionEntityViewer
        id={combineIds(id, "proposition-viewer")}
        proposition={appearance.apparition.entity}
      />
      <p>appears in</p>
      <MediaExcerptEntityViewer
        id={combineIds(id, "media-excerpt-viewer")}
        mediaExcerpt={appearance.mediaExcerpt}
      />
      <CreationInfo created={appearance.created} creator={appearance.creator} />
    </div>
  );
}
