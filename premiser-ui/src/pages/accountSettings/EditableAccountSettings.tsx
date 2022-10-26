import AccountSettingsEditor from "./AccountSettingsEditor"
import AccountSettingsViewer from "./AccountSettingsViewer"
import withEditableEntity from "../../withEditableEntity"

export default withEditableEntity('ACCOUNT_SETTINGS', AccountSettingsEditor, AccountSettingsViewer)
