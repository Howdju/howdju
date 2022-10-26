import {EditorTypes} from "../../reducers/editors"
import withEditor from "@/editors/withEditor"
import AccountSettingsEditorFields from "./AccountSettingsEditorFields"
import {schemaIds} from "howdju-common"

export default withEditor(EditorTypes.ACCOUNT_SETTINGS, AccountSettingsEditorFields,
  'accountSettings', schemaIds.accountSettings)
