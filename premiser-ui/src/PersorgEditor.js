import {EditorTypes} from "./reducers/editors"
import PersorgEditorFields from "./PersorgEditorFields"
import withEntityEditor from "./withEntityEditor"
import {schemaIds} from "howdju-common"

export default withEntityEditor(EditorTypes.PERSORG, PersorgEditorFields, 'persorg',
  schemaIds.persorg)
