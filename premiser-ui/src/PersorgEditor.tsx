import { UpdatePersorgInput } from "howdju-common";

import PersorgEditorFields from "./PersorgEditorFields";
import withEditor from "./editors/withEditor";
import { UpdatePersorgConfig } from "./sagas/editors/editorCommitEditSaga";

export default withEditor(
  "PERSORG",
  PersorgEditorFields,
  "persorg",
  UpdatePersorgInput,
  UpdatePersorgConfig
);
