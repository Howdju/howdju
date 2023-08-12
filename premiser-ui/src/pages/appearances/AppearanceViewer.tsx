import React from "react";

import { AppearanceView } from "howdju-common";

import CreationInfo from "@/components/creationInfo/CreationInfo";
import PropositionViewer from "@/PropositionViewer";
import MediaExcerptViewer from "@/components/mediaExcerpts/MediaExcerptViewer";

interface Props {
  appearance: AppearanceView;
}

export default function AppearanceViewer({ appearance }: Props) {
  return (
    <div>
      <h1>Appearance</h1>
      <CreationInfo created={appearance.created} creator={appearance.creator} />
      <h2>Proposition</h2>
      <PropositionViewer proposition={appearance.apparition.entity} />
      <h2>Media Excerpt</h2>
      <MediaExcerptViewer mediaExcerpt={appearance.mediaExcerpt} />
    </div>
  );
}
