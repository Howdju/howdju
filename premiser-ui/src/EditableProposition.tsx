import React from "react";
import { CircularProgress } from "react-md";

import { ContextTrailItem, isTruthy, PropositionOut } from "howdju-common";

import { defaultEditorState, EditorTypes } from "./reducers/editors";
import PropositionViewer from "./PropositionViewer";
import PropositionEditor from "./PropositionEditor";
import { ComponentId, EditorId } from "./types";
import { useAppSelector } from "./hooks";

interface Props {
  /** Required for the CircularProgress */
  id: ComponentId;
  /** Identifies the editor's state */
  editorId: EditorId;
  proposition: PropositionOut;
  showStatusText: boolean;
  contextTrailItems?: ContextTrailItem[];
  showJustificationCount?: boolean;
}

export default function EditableProposition({
  id,
  editorId,
  proposition,
  showStatusText,
  contextTrailItems,
  showJustificationCount = true,
}: Props) {
  const { editEntity } = useAppSelector((state) => {
    const editorState = editorId
      ? state.editors?.[EditorTypes.PROPOSITION]?.[editorId]
      : undefined;
    return editorState ?? defaultEditorState();
  });
  const isEditing = isTruthy(editEntity);

  // lazy because editorId may not be available
  const editor = () => <PropositionEditor editorId={editorId} id={id} />;

  const viewer = (
    <PropositionViewer
      id={id}
      proposition={proposition}
      showStatusText={showStatusText}
      contextTrailItems={contextTrailItems}
      showJustificationCount={showJustificationCount}
    />
  );

  const progress = <CircularProgress id={`${id}--loading`} />;

  return isEditing ? editor() : !proposition ? progress : viewer;
}
