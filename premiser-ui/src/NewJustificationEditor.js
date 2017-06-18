import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import Button from 'react-md/lib/Buttons/Button'
import get from 'lodash/get'
import merge from 'lodash/merge'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors";
import {
  CANCEL_BUTTON_LABEL, EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts";
import {default as t} from './texts'
import NewJustificationEditorFields from "./NewJustificationEditorFields";
import {justificationBasisTypeToNewJustificationBasisMemberName, makeNewJustification} from "./models";


class NewJustificationEditor extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onAddUrl = this.onAddUrl.bind(this)
    this.onRemoveUrl = this.onRemoveUrl.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancelEdit = this.onCancelEdit.bind(this)
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(EditorTypes.NEW_JUSTIFICATION, this.props.editorId, properties)
  }

  onAddUrl() {
    this.props.editors.addUrl(EditorTypes.NEW_JUSTIFICATION, this.props.editorId)
  }

  onRemoveUrl(url, index) {
    this.props.editors.deleteUrl(EditorTypes.NEW_JUSTIFICATION, this.props.editorId, url, index)
  }

  onSubmit(event) {
    if (!this.props.onSubmit) {
      event.preventDefault()
      this.props.editors.commitEdit(EditorTypes.NEW_JUSTIFICATION, this.props.editorId)
    } else {
      this.props.onSubmit(event)
    }
  }

  onCancelEdit() {
    this.props.editors.cancelEdit(EditorTypes.NEW_JUSTIFICATION, this.props.editorId)
  }

  render() {
    const {
      suggestionsKey,
      editorState,
      doShowButtons,
    } = this.props

    const {errors, isSaving} = editorState
    const editEntity = editorState.editEntity || makeNewJustification()

    const buttons = [
      <Button flat
              key="cancelButton"
              label={t(CANCEL_BUTTON_LABEL)}
              onClick={this.onCancelEdit} />,
      <Button flat
              primary
              key="submitButton"
              type="submit"
              label={t(EDIT_STATEMENT_SUBMIT_BUTTON_LABEL)}
              disabled={isSaving}
      />
    ]

    return (
        <form onSubmit={this.onSubmit}>
          <NewJustificationEditorFields newJustification={editEntity}
                                        onPropertyChange={this.onPropertyChange}
                                        onAddUrlClick={this.onAddUrl}
                                        onDeleteUrlClick={this.onRemoveUrl}
                                        onSubmit={this.onSubmit}
                                        suggestionsKey={suggestionsKey}
                                        errors={errors}
          />
          {doShowButtons && buttons}
        </form>
    )
  }
}
NewJustificationEditor.propTypes = {
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  /** If present, defers submits to this function */
  onSubmit: PropTypes.func,
  doShowButtons: PropTypes.bool,
}
NewJustificationEditor.defaultProps = {
  doShowButtons: true
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.NEW_JUSTIFICATION, ownProps.editorId]) || {}
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(NewJustificationEditor)