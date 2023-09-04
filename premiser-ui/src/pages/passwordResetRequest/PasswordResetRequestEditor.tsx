import { CreatePasswordResetRequestInput } from "howdju-common";

import withEditor from "@/editors/withEditor";
import { PasswordResetRequestConfig } from "@/sagas/editors/editorCommitEditSaga";
import PasswordResetRequestEditorFields from "./PasswordResetRequestEditorFields";

// TODO(460) property name should be inferred; ideally editor type too.
export default withEditor(
  "PASSWORD_RESET_REQUEST",
  PasswordResetRequestEditorFields,
  "passwordResetRequest",
  CreatePasswordResetRequestInput,
  PasswordResetRequestConfig
);
