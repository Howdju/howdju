import { EditorTypes } from "../reducers/editors";
import JustificationEditorFields from "./JustificationEditorFields";
import { CreateJustificationInput } from "howdju-common";
import withEditor from "./withEditor";
import { CreateJustificationConfig } from "../sagas/editors/editorCommitEditSaga";

/** A new Justification editor. */
const JustificationEditor = withEditor(
  EditorTypes.NEW_JUSTIFICATION,
  JustificationEditorFields,
  "justification",
  CreateJustificationInput,
  CreateJustificationConfig
);

export default JustificationEditor;
