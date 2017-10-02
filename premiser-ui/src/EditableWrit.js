import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import get from 'lodash/get'

import {
  isTruthy,
  newUnimplementedError,
} from 'howdju-common'

import {EditorTypes} from "./reducers/editors"
import WritViewer from "./WritViewer"


class EditableWrit extends Component {

  render() {
    const {
      id,
      textId,
      editorId,
      writ,
      suggestionsKey,
      isFetching,
      isEditing,
      // ignore
      dispatch,
      ...rest,
    } = this.props

    const editor = () => {
      throw newUnimplementedError('WritEditor')
    }

    const viewer = (
      <WritViewer
        {...rest}
        id={id}
        writ={writ}
      />
    )

    const progress = (
      <CircularProgress id={`${id}--loading`} />
    )

    return isEditing ?
      editor() :
      !writ ? progress : viewer
  }
}
EditableWrit.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  writ: PropTypes.object,
}

const mapStateToProps = (state, ownProps) => {
  const editorId = ownProps.editorId
  const {editEntity, isFetching} = editorId ?
    get(state.editors, [EditorTypes.WRIT, editorId], {}) :
    {}
  const isEditing = isTruthy(editEntity)
  return {
    isFetching,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableWrit)
