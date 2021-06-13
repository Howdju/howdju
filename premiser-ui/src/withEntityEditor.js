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
import {
  CANCEL_BUTTON_LABEL,
} from "./texts"
import t, {EDIT_ENTITY_SUBMIT_BUTTON_LABEL} from './texts'

export default function withEntityEditor(editorType, EntityEditorFields, editorFieldsEditEntityPropName) {

  class EntityEditor extends Component {
    static editorType = editorType

    onPropertyChange = (properties) => {
      this.props.editors.propertyChange(editorType, this.props.editorId, properties)
    }

    onSubmit = (event) => {
      event.preventDefault()
      this.props.editors.commitEdit(editorType, this.props.editorId)
      if (this.props.onSubmit) {
        this.props.onSubmit()
      }
    }

    onCancelEdit = () => {
      this.props.editors.cancelEdit(editorType, this.props.editorId)
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

      // Provide the editEntity using a prop name that the EntityEditorFields understands
      const entityEditorFields = {
        [editorFieldsEditEntityPropName]: editEntity
      }

      return (
        <form onSubmit={this.onSubmit}>
          <CardText>
            <EntityEditorFields
              {...rest}
              id={id}
              nameId={nameId}
              disabled={isSaving}
              suggestionsKey={suggestionsKey}
              onPropertyChange={this.onPropertyChange}
              onSubmit={this.onSubmit}
              errors={errors}
              {...entityEditorFields}
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
                    children={t(EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
                    disabled={inProgress}
            />
          </CardActions>
        </form>
      )
    }
  }

  const mapStateToProps = (state, ownProps) => {
    const editorState = get(state.editors, [editorType, ownProps.editorId], {})
    return {
      editorState,
    }
  }

  return connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
    editors,
  }))(EntityEditor)
}
