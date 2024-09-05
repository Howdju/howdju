import { newCustomError } from "howdju-common";
import { clientNetworkErrorTypes } from "howdju-client-common";

import { EditorType } from "./reducers/editors";
import { EditorId } from "./types";

export const newEditorCommitResultError = (
  editorType: EditorType,
  editorId: EditorId,
  sourceError: Error
) => {
  const message = `Error committing ${editorType} editor ${editorId} (source error message: ${sourceError.message})`;
  return newCustomError(
    clientNetworkErrorTypes.COMMIT_EDIT_RESULT_ERROR,
    message,
    sourceError,
    { editorType, editorId }
  );
};
