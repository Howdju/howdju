import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import {CircularProgress} from "react-md"
import get from 'lodash/get'

import {isTruthy} from 'howdju-common'

import PersorgViewer from "./PersorgViewer"
import PersorgEditor from "./PersorgEditor"


class EditablePersorg extends Component {

  static propTypes = {
    /** Required for the CircularProgress */
    id: PropTypes.string.isRequired,
    /** Identifies the editor's state */
    editorId: PropTypes.string,
    /** If omitted, no autocomplete */
    suggestionsKey: PropTypes.string,
    persorg: PropTypes.object,
  }

  static defaultProps = {
    showStatusText: true,
  }

  render() {
    const {
      id,
      textId,
      editorId,
      persorg,
      suggestionsKey,
      isFetching,
      isEditing,
      showStatusText,
      // ignore
      dispatch,
      ...rest
    } = this.props

    // lazy because editorId may not be available
    const editor = () => (
      <PersorgEditor
        {...rest}
        editorId={editorId}
        id={id}
        suggestionsKey={suggestionsKey}
        disabled={isFetching}
      />
    )

    const viewer = (
      <PersorgViewer
        {...rest}
        id={id}
        persorg={persorg}
        showStatusText={showStatusText}
      />
    )

    const progress = (
      <CircularProgress id={`${id}--loading`} />
    )

    return isEditing ?
      editor() :
      !persorg ? progress : viewer
  }
}

const mapStateToProps = (state, ownProps) => {
  const editorId = ownProps.editorId
  const {editEntity, isFetching} = editorId ?
    get(state.editors, [PersorgEditor.editorType, editorId], {}) :
    {}
  const isEditing = isTruthy(editEntity)
  return {
    isFetching,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditablePersorg)