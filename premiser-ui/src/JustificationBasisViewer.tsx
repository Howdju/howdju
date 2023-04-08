import React from "react";

import {
  ContextTrailItem,
  JustificationBasisTypes,
  JustificationOut,
  newExhaustedEnumError,
} from "howdju-common";

import PropositionCompoundViewer from "./PropositionCompoundViewer";
import WritQuoteEntityViewer from "./WritQuoteEntityViewer";
import { ComponentId } from "./types";
import SourceExcerptEntityViewer from "./SourceExcerptEntityViewer";
import { OnClickWritQuoteUrl } from "./WritQuoteViewer";
import { combineEditorIds } from "./viewModels";

import "./JustificationBasisViewer.scss";

interface Props {
  id: ComponentId;
  justification: JustificationOut;
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
    case "SOURCE_EXCERPT":
      return <SourceExcerptEntityViewer />;
    default:
      throw newExhaustedEnumError(basis);
  }
}
