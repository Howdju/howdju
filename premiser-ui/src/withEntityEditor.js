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
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'
import merge from 'lodash/merge'

import {toJson} from "howdju-common"
import {validate, emptyValidationResult} from "howdju-ajv-sourced"

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {
  CANCEL_BUTTON_LABEL,
} from "./texts"
import t, {EDIT_ENTITY_SUBMIT_BUTTON_LABEL} from './texts'
import {logger} from './logger'

/**
 * HOC for creating an editor of an entity.
 *
 * @param editorType {EditorType|string} The EditorType
 * @param EntityEditorFields {EditorFields} The fields for editing the entity
 * @param editorFieldsEditEntityPropName {string} The prop name under which the edited entity should be provided to the
 *     editor fields
 * @param schemaId The ID of the schema for validating the editEntity.
 * @deprecated Use withEditor instead
 * @returns {Component} An entity editor component
 */
export default function withEntityEditor(
  editorType, EntityEditorFields, editorFieldsEditEntityPropName, schemaId) {

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
      /** The label to use for the submit button. If missing, a default is used. */
      submitText: PropTypes.string,
    }

    render() {
      const {
        id,
        nameId,
        suggestionsKey,
        submitText,
        editorState: {
          errors: apiValidationErrors,
          editEntity,
          isFetching,
          isSaving,
          dirtyFields,
        },
        // ignore
        editors,
        editorId,
        ...rest
      } = this.props

      const inProgress = isFetching || isSaving

      // Provide the editEntity using a prop name that the EntityEditorFields understands
      const entityEditorFields = {
        [editorFieldsEditEntityPropName]: editEntity,
      }

      const {errors: clientValidationErrors} = editEntity ?
        validate(schemaId, editEntity) :
        emptyValidationResult()
      // Because the API should validate the same data using the same schema, it shouldn't be possible
      // to receive API errors that didn't also fail client validation.
      if (apiValidationErrors && !isEqual(clientValidationErrors, apiValidationErrors)) {
        logger.error(`clientValidationErrors and apiValidationErrors do not match ` +
            `${toJson({clientValidationErrors, apiValidationErrors})}`)
      }
      // apiValidationErrors comes after so that it will override clientValidationErrors, since ultimately the API
      // must accept the value.
      const errors = merge(clientValidationErrors, apiValidationErrors)

      return (
        <form onSubmit={this.onSubmit}>
          <CardText>
            <EntityEditorFields
              {...rest}
              id={id}
              nameId={nameId}
              suggestionsKey={suggestionsKey}
              onPropertyChange={this.onPropertyChange}
              onSubmit={this.onSubmit}
              dirtyFields={dirtyFields}
              errors={errors}
              disabled={inProgress}
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
                    children={submitText || t(EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
                    disabled={inProgress || !isEmpty(errors)}
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
