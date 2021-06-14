import {EditorTypes} from "./reducers/editors"
import withEntityEditor from "./withEntityEditor"
import AccountSettingsEditorFields from "./AccountSettingsEditorFields"

export default withEntityEditor(EditorTypes.ACCOUNT_SETTINGS, AccountSettingsEditorFields,
  'accountSettings')
