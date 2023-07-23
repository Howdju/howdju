import { CreateUrlLocatorsInput } from "howdju-common";

import withEditor from "@/editors/withEditor";
import CreateUrlLocatorsEditorFields from "./CreateUrlLocatorsEditorFields";
import { CreateUrlLocatorsCommitConfig } from "@/sagas/editors/editorCommitEditSaga";

export default withEditor(
  "CREATE_URL_LOCATORS",
  CreateUrlLocatorsEditorFields,
  "editModel",
  CreateUrlLocatorsInput,
  CreateUrlLocatorsCommitConfig
);
