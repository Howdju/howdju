import { CreateCounterJustificationInput } from "howdju-common";

import { EditorTypes } from "../reducers/editors";
import withEditor from "./withEditor";
import { CreateCounterJustificationConfig } from "../sagas/editors/editorCommitEditSaga";
import CounterJustificationEditorFields from "./CounterJustificationEditorFields";

/** A counter justification editor. */
export default withEditor(
  EditorTypes.COUNTER_JUSTIFICATION,
  CounterJustificationEditorFields,
  "justification",
  CreateCounterJustificationInput,
  CreateCounterJustificationConfig
);
