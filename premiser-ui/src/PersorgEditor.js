import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import {
  Button,
  CircularProgress,
  CardActions,
  CardText,
} from 'react-md'
import get from 'lodash/get'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors"
import PersorgEditorFields from "./PersorgEditorFields"
import {
  CANCEL_BUTTON_LABEL, EDIT_PROPOSITION_SUBMIT_BUTTON_LABEL
} from "./texts"
import t from './texts'

class PersorgEditor extends Component {

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(PersorgEditor.editorType, this.props.editorId, properties)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(PersorgEditor.editorType, this.props.editorId)
    if (this.props.onSubmit) {
      this.props.onSubmit()
    }
  }

  onCancelEdit = () => {
    this.props.editors.cancelEdit(PersorgEditor.editorType, this.props.editorId)
    if (this.props.onCancel) {
      this.props.onCancel()
    }
  }

  static propTypes = {
    id: PropTypes.string.isRequired,
    /** Identifies the editor's state */
    editorId: PropTypes.string.isRequired,
    /** If omitted, no autocomplete */
    suggestionsKey: PropTypes.string,
    disabled: PropTypes.bool,
    /** If present, called whenever the user cancels the edit */
    onCancel: PropTypes.func,
    /** If present, called when the user submits */
    onSubmit: PropTypes.func,
  }
  static editorType = EditorTypes.PERSORG

  render() {
    const {
      id,
      nameId,
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isFetching,
        isSaving,
      },
      // ignore
      editors,
      editorId,
      ...rest
    } = this.props

    const inProgress = isFetching || isSaving

    return (
      <form onSubmit={this.onSubmit}>
        <CardText>
          <PersorgEditorFields
            {...rest}
            id={id}
            nameId={nameId}
            persorg={editEntity}
            disabled={isSaving}
            suggestionsKey={suggestionsKey}
            onPropertyChange={this.onPropertyChange}
            onSubmit={this.onSubmit}
            errors={errors}
          />
        </CardText>
        <CardActions>
          {inProgress && <CircularProgress key="progress" id="progress" />}
          <Button flat
                  key="cancelButton"
                  children={t(CANCEL_BUTTON_LABEL)}
                  onClick={this.onCancelEdit}
                  disabled={inProgress}
          />
          <Button raised
                  primary
                  key="submitButton"
                  type="submit"
                  children={t(EDIT_PROPOSITION_SUBMIT_BUTTON_LABEL)}
                  disabled={inProgress}
          />
        </CardActions>
      </form>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [PersorgEditor.editorType, ownProps.editorId], {})
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(PersorgEditor)
