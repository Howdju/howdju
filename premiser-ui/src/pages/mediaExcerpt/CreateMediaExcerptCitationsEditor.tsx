import { CreateMediaExcerptCitationsInput } from "howdju-common";

import withEditor from "@/editors/withEditor";
import CreateMediaExcerptCitationsEditorFields from "./CreateMediaExcerptCitationsEditorFields";
import { CreateMediaExcerptCitationsCommitConfig } from "@/sagas/editors/editorCommitEditSaga";

export default withEditor(
  "CREATE_MEDIA_EXCERPT_CITATIONS",
  CreateMediaExcerptCitationsEditorFields,
  "editModel",
  CreateMediaExcerptCitationsInput,
  CreateMediaExcerptCitationsCommitConfig
);
