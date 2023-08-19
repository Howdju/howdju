import React from "react";
import { Button } from "react-md";
import { MaterialSymbol } from "react-material-symbols";

import { AppearanceView } from "howdju-common";

import CreationInfo from "@/components/creationInfo/CreationInfo";
import { combineIds } from "@/viewModels";
import PropositionEntityViewer from "@/PropositionEntityViewer";
import MediaExcerptEntityViewer from "@/components/mediaExcerpts/MediaExcerptEntityViewer";
import paths from "@/paths";
import Link from "@/Link";

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
      <Link
        to={paths.factCheck(
          appearance.creator.id,
          appearance.mediaExcerpt.citations.map((c) => c.source.id),
          appearance.mediaExcerpt.locators.urlLocators.map((l) => l.url.id)
        )}
      >
        <Button flat secondary iconEl={<MaterialSymbol icon="how_to_reg" />}>
          User&rsquo;s fact-check
        </Button>
      </Link>
    </div>
  );
}
