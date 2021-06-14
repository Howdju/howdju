import React from 'react'
import PersorgEditor from "./PersorgEditor"
import PersorgViewer from "./PersorgViewer"
import withEditableEntity from "./withEditableEntity"

export default withEditableEntity('persorg', PersorgEditor, PersorgViewer)
