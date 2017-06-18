import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import Button from 'react-md/lib/Buttons/Button'
import get from 'lodash/get'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors";
import StatementEditorFields from "./StatementEditorFields";
import {
  CANCEL_BUTTON_LABEL, EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts";
import {default as t} from './texts'

class StatementEditor extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancelEdit = this.onCancelEdit.bind(this)
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(EditorTypes.STATEMENT, this.props.editorId, properties)
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.editors.commitEdit(EditorTypes.STATEMENT, this.props.editorId)
  }

  onCancelEdit() {
    this.props.editors.cancelEdit(EditorTypes.STATEMENT, this.props.editorId)
  }

  render() {
    const {
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isSaving,
      },
      ...rest,
    } = this.props
    delete rest.editors
    delete rest.editorId

    return (
        <form onSubmit={this.onSubmit}>
          <StatementEditorFields statement={editEntity}
                                 disabled={isSaving}
                                 suggestionsKey={suggestionsKey}
                                 onPropertyChange={this.onPropertyChange}
                                 errors={errors}
                                 {...rest}
          />
          <Button flat
                  key="cancelButton"
                  label={t(CANCEL_BUTTON_LABEL)}
                  onClick={this.onCancelEdit} />
          <Button flat
                  primary
                  key="submitButton"
                  type="submit"
                  label={t(EDIT_STATEMENT_SUBMIT_BUTTON_LABEL)}
                  disabled={isSaving}
          />
        </form>
    )
  }
}
StatementEditor.propTypes = {
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.STATEMENT, ownProps.editorId], {})
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(StatementEditor)