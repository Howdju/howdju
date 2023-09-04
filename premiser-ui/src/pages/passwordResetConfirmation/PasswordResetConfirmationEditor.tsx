import { PasswordResetConfirmation } from "howdju-common";

import withEditor from "@/editors/withEditor";
import { PasswordResetConfirmationConfig } from "@/sagas/editors/editorCommitEditSaga";
import PasswordResetConfirmationEditorFields from "./PasswordResetConfirmationEditorFields";

// TODO(460) property name should be inferred; ideally editor type too.
export default withEditor(
  "PASSWORD_RESET_CONFIRMATION",
  PasswordResetConfirmationEditorFields,
  "passwordResetConfirmation",
  PasswordResetConfirmation,
  PasswordResetConfirmationConfig
);
