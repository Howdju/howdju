import React from 'react'

import EditablePersorg from './EditablePersorg'
import withEntityViewer from "./withEntityViewer"
import paths from "./paths"

export default withEntityViewer(EditablePersorg, 'persorg', "person",
  "Person/Organization", paths.persorg)
