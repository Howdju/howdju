import { UpdateSourceInput } from "howdju-common";

import SourceEditorFields from "./SourceEditorFields";
import withEditor from "@/editors/withEditor";
import { UpdateSourceConfig } from "@/sagas/editors/editorCommitEditSaga";

// TODO(460) property name should be inferred; ideally editor type too.
export default withEditor(
  "SOURCE",
  SourceEditorFields,
  "source",
  UpdateSourceInput,
  UpdateSourceConfig
);
