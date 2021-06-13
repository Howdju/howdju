import React from 'react'
import {EditorTypes} from "./reducers/editors"
import PersorgEditorFields from "./PersorgEditorFields"
import withEntityEditor from "./withEntityEditor"

export default withEntityEditor(EditorTypes.PERSORG, PersorgEditorFields, 'persorg')
