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
import {
  CANCEL_BUTTON_LABEL, EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts";
import {default as t} from './texts'
import CitationReferenceEditorFields from "./CitationReferenceEditorFields";

class EditableCitationReference extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancelEdit = this.onCancelEdit.bind(this)
    this.onAddUrl = this.onAddUrl.bind(this)
    this.onRemoveUrl = this.onRemoveUrl.bind(this)
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(EditorTypes.CITATION_REFERENCE, this.props.editorId, properties)
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.editors.commitEdit(EditorTypes.CITATION_REFERENCE, this.props.editorId)
  }

  onCancelEdit() {
    this.props.editors.cancelEdit(EditorTypes.CITATION_REFERENCE, this.props.editorId)
  }

  onAddUrl() {
    this.props.editors.addUrl(EditorTypes.CITATION_REFERENCE, this.props.editorId)
  }

  onRemoveUrl(url, index) {
    this.props.editors.removeUrl(EditorTypes.CITATION_REFERENCE, this.props.editorId, url, index)
  }

  render() {
    const {
      id,
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isSaving,
      },
      ...rest
    } = this.props

    return (
        <form onSubmit={this.onSubmit}>
          <CitationReferenceEditorFields id={id}
                                         citationReference={editEntity}
                                         disabled={isSaving}
                                         suggestionsKey={suggestionsKey}
                                         onPropertyChange={this.onPropertyChange}
                                         onAddUrl={this.onAddUrl}
                                         onRemoveUrl={this.onRemoveUrl}
                                         errors={errors}
                                         onSubmit={this.onSubmit}
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
EditableCitationReference.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.CITATION_REFERENCE, ownProps.editorId], {})
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(EditableCitationReference)