import AccountSettingsEditor from "./AccountSettingsEditor"
import AccountSettingsViewer from "./AccountSettingsViewer"
import withEditableEntity from "./withEditableEntity"

export default withEditableEntity('accountSettings', AccountSettingsEditor, AccountSettingsViewer)
