import { CreateMediaExcerptInput } from "howdju-common";

import MediaExcerptEditorFields from "./MediaExcerptEditorFields";
import withEditor from "./withEditor";
import { MediaExcerptConfig } from "../sagas/editors/editorCommitEditSaga";

/** A MediaExcerpt editor. */
export default withEditor(
  "MEDIA_EXCERPT",
  MediaExcerptEditorFields,
  "model",
  CreateMediaExcerptInput,
  MediaExcerptConfig
);
