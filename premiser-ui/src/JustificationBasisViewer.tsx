import React from "react";

import {
  ContextTrailItem,
  JustificationBasisTypes,
  JustificationView,
  newExhaustedEnumError,
} from "howdju-common";

import PropositionCompoundViewer from "./PropositionCompoundViewer";
import WritQuoteEntityViewer from "./WritQuoteEntityViewer";
import { ComponentId } from "./types";
import { OnClickWritQuoteUrl } from "./WritQuoteViewer";
import { combineEditorIds } from "./viewModels";
import MediaExcerptViewer from "./components/mediaExcerpts/MediaExcerptViewer";

import "./JustificationBasisViewer.scss";

interface Props {
  id: ComponentId;
  justification: JustificationView;
  showStatusText: boolean;
  showUrls: boolean;
  contextTrailItems?: ContextTrailItem[];
  onClickWritQuoteUrl: OnClickWritQuoteUrl;
}

export default function JustificationBasisViewer(props: Props) {
  const basisViewer = makeBasisViewer(props);
  return <div className="justification-basis-viewer">{basisViewer}</div>;
}

function makeBasisViewer({
  id,
  justification,
  showStatusText,
  showUrls,
  contextTrailItems,
  onClickWritQuoteUrl,
}: Props) {
  const basis = justification.basis;
  const writQuoteEditorId = combineEditorIds(id, "writ-quote");
  switch (basis.type) {
    case JustificationBasisTypes.PROPOSITION_COMPOUND:
      return (
        <PropositionCompoundViewer
          id={id}
          propositionCompound={basis.entity}
          showStatusText={showStatusText}
          contextTrailItems={contextTrailItems}
        />
      );
    case "MEDIA_EXCERPT":
      return <MediaExcerptViewer mediaExcerpt={basis.entity} />;
    case JustificationBasisTypes.WRIT_QUOTE:
      return (
        <WritQuoteEntityViewer
          id={id}
          writQuote={basis.entity}
          editorId={writQuoteEditorId}
          showStatusText={showStatusText}
          showUrls={showUrls}
          onClickUrl={onClickWritQuoteUrl}
        />
      );
    default:
      throw newExhaustedEnumError(basis);
  }
}
