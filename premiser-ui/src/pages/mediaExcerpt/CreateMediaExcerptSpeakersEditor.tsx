import { CreateMediaExcerptSpeakersInput } from "howdju-common";

import withEditor from "@/editors/withEditor";
import CreateMediaExcerptSpeakersEditorFields from "./CreateMediaExcerptSpeakersEditorFields";
import { CreateMediaExcerptSpeakersCommitConfig } from "@/sagas/editors/editorCommitEditSaga";

export default withEditor(
  "CREATE_MEDIA_EXCERPT_SPEAKERS",
  CreateMediaExcerptSpeakersEditorFields,
  "editModel",
  CreateMediaExcerptSpeakersInput,
  CreateMediaExcerptSpeakersCommitConfig
);
