import { CreateRegistrationConfirmationInput } from "howdju-common";

import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";
import RegistrationConfirmationFields from "./RegistrationConfirmationEditorFields";
import { CreateRegistrationConfirmationConfig } from "@/sagas/editors/editorCommitEditSaga";

/** A RegistrationConfirmation editor. */
export default withEditor(
  EditorTypes.REGISTRATION_CONFIRMATION,
  RegistrationConfirmationFields,
  "registrationConfirmation",
  CreateRegistrationConfirmationInput,
  CreateRegistrationConfirmationConfig
);
