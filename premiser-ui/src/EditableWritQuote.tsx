import React from "react";
import { CircularProgress } from "react-md";

import WritQuoteViewer, { OnClickWritQuoteUrl } from "./WritQuoteViewer";
import WritQuoteEditor from "./editors/WritQuoteEditor";
import { ComponentId, EditorId } from "./types";
import { WritQuoteOut } from "howdju-common";
import { useAppSelector } from "./hooks";

interface Props {
  id: ComponentId;
  editorId: EditorId;
  writQuote: WritQuoteOut;
  showStatusText: boolean;
  showUrls: boolean;
  onClickUrl: OnClickWritQuoteUrl;
}

export default function EditableWritQuote({
  id,
  editorId,
  writQuote,
  showStatusText,
  showUrls,
  onClickUrl,
}: Props) {
  const editor = () => (
    <WritQuoteEditor id={id} writQuote={writQuote} editorId={editorId} />
  );

  const viewer = (
    <WritQuoteViewer
      writQuote={writQuote}
      showStatusText={showStatusText}
      showUrls={showUrls}
      onClickUrl={onClickUrl}
    />
  );
  const progress = <CircularProgress id={`${id}-Progress`} />;

  const { editEntity } =
    useAppSelector((state) => state.editors.WRIT_QUOTE?.[editorId]) || {};
  const isEditing = !!editEntity;
  const isFetching = !!writQuote;

  return isFetching ? progress : isEditing ? editor() : viewer;
}
