import React from "react";
import EditableWritQuote from "./EditableWritQuote";

import { newUnimplementedError, SourceExcerptOut } from "howdju-common";

import { ComponentId, EditorId } from "./types";
import { OnClickWritQuoteUrl } from "./WritQuoteViewer";

interface Props {
  id: ComponentId;
  sourceExcerpt: SourceExcerptOut;
  editorId: EditorId;
  showStatusText: boolean;
  showUrls: boolean;
  onClickWritQuoteUrl: OnClickWritQuoteUrl;
}

export default function SourceExcerptViewer({
  id,
  sourceExcerpt,
  editorId,
  showStatusText,
  showUrls,
  onClickWritQuoteUrl,
  ...rest
}: Props) {
  switch (sourceExcerpt.type) {
    case "WRIT_QUOTE":
      return (
        <EditableWritQuote
          {...rest}
          id={id}
          writQuote={sourceExcerpt.entity}
          editorId={editorId}
          showStatusText={showStatusText}
          showUrls={showUrls}
          onClickUrl={onClickWritQuoteUrl}
        />
      );
    default:
      throw newUnimplementedError(
        `SourceExcerptViewer does not support SourceExcerpt.type ${sourceExcerpt.type}`
      );
  }
}
