import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import get from 'lodash/get'

import {isTruthy} from 'howdju-common'

import {EditorTypes} from "./reducers/editors"
import StatementViewer from "./StatementViewer"
import StatementEditor from "./StatementEditor"


class EditableStatement extends Component {

  render() {
    const {
      id,
      textId,
      editorId,
      statement,
      suggestionsKey,
      isFetching,
      isEditing,
      showStatusText,
      trailStatements,
      // ignore
      dispatch,
      ...rest,
    } = this.props

    // lazy because editorId may not be available
    const editor = () => (
      <StatementEditor
        {...rest}
        editorId={editorId}
        id={id}
        textId={textId}
        suggestionsKey={suggestionsKey}
        disabled={isFetching}
      />
    )

    const viewer = (
      <StatementViewer
        {...rest}
        id={id}
        statement={statement}
        showStatusText={showStatusText}
        trailStatements={trailStatements}
      />
    )

    const progress = (
      <CircularProgress id={`${id}--loading`} />
    )

    return isEditing ?
      editor() :
      !statement ? progress : viewer
  }
}
EditableStatement.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  statement: PropTypes.object,
}

const mapStateToProps = (state, ownProps) => {
  const editorId = ownProps.editorId
  const {editEntity, isFetching} = editorId ?
    get(state.editors, [EditorTypes.STATEMENT, editorId], {}) :
    {}
  const isEditing = isTruthy(editEntity)
  return {
    isFetching,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableStatement)
