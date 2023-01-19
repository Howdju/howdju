import { CreateRegistrationRequestInput } from "howdju-common";

import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";
import RegistrationRequestFields from "./RegistrationRequestEditorFields";
import { CreateRegistrationRequestConfig } from "@/sagas/editors/editorCommitEditSaga";

/** A RegistrationConfirmation editor. */
export default withEditor(
  EditorTypes.REGISTRATION_REQUEST,
  RegistrationRequestFields,
  "registrationRequest",
  CreateRegistrationRequestInput,
  CreateRegistrationRequestConfig
);
