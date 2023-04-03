import React from "react";
import { Paper } from "react-md";

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

interface Props {
  id: ComponentId;
  justification: JustificationOut;
  showStatusText: boolean;
  showUrls: boolean;
  contextTrailItems?: ContextTrailItem[];
  onClickWritQuoteUrl: OnClickWritQuoteUrl;
}

export default function JustificationBasisViewer({
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
        <Paper>
          <WritQuoteEntityViewer
            id={id}
            writQuote={basis.entity}
            editorId={writQuoteEditorId}
            showStatusText={showStatusText}
            showUrls={showUrls}
            onClickUrl={onClickWritQuoteUrl}
          />
        </Paper>
      );
    case "SOURCE_EXCERPT":
      return <SourceExcerptEntityViewer />;
    default:
      throw newExhaustedEnumError(basis);
  }
}
