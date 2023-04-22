import React from "react";
import { CircularProgress } from "react-md";

import { WritOut } from "howdju-common";

import { OnClickWritQuoteUrl } from "./WritQuoteViewer";
import { ComponentId, EditorId } from "./types";
import { useAppSelector } from "./hooks";
import { combineIds, defaultEditorId } from "./viewModels";
import WritViewer from "./WritViewer";
import UpdateWritEditor from "./editors/UpdateWritEditor";

interface Props {
  id: ComponentId;
  editorId?: EditorId;
  writ: WritOut;
  showStatusText?: boolean;
  showUrls?: boolean;
  onClickUrl?: OnClickWritQuoteUrl;
}

export default function EditableWrit({
  id,
  editorId = defaultEditorId(id),
  writ,
  showStatusText,
}: Props) {
  const editor = () => (
    <UpdateWritEditor id={id} writ={writ} editorId={editorId} />
  );

  const viewer = (
    <WritViewer
      id={combineIds(id, "viewer")}
      writ={writ}
      showStatusText={showStatusText}
    />
  );
  const progress = <CircularProgress id={`${id}-Progress`} />;

  const { editEntity } =
    useAppSelector((state) => state.editors.WRIT_QUOTE?.[editorId]) || {};
  const isEditing = !!editEntity;
  const isFetching = !writ;

  return isFetching ? progress : isEditing ? editor() : viewer;
}
