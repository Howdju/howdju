import React, {Component} from 'react'

import EditablePersorg from './EditablePersorg'
import withEntityViewer from "./withEntityViewer"
import paths from "./paths"

export default withEntityViewer(EditablePersorg, 'persorg', paths.persorg)
