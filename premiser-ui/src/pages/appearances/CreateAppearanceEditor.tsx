import { CreateAppearanceInput } from "howdju-common";

import AppearanceEditorFields from "./AppearanceEditorFields";
import { AppearanceConfig } from "@/sagas/editors/editorCommitEditSaga";
import withEditor from "@/editors/withEditor";

/** A MediaExcerpt editor. */
export default withEditor(
  "APPEARANCE",
  AppearanceEditorFields,
  "appearance",
  CreateAppearanceInput,
  AppearanceConfig
);
