import {EditorTypes} from "./reducers/editors"
import withEntityEditor from "./withEntityEditor"
import AccountSettingsEditorFields from "./AccountSettingsEditorFields"
import {schemaIds} from "howdju-common"

export default withEntityEditor(EditorTypes.ACCOUNT_SETTINGS, AccountSettingsEditorFields,
  'accountSettings', schemaIds.accountSettings)
