import { UpdateWritInput } from "howdju-common";

import WritEditorFields from "./WritEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A Writ editor. */
const UpdateWritEditor = withEditor(
  EditorTypes.WRIT_QUOTE,
  WritEditorFields,
  "writ",
  UpdateWritInput
  // TODO(273): add commit config
);

export default UpdateWritEditor;
