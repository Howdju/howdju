import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import {CircularProgress} from "react-md"
import get from 'lodash/get'

import {isTruthy} from 'howdju-common'

/**
 * HOC for creating an editable entity component
 *
 * @param editorType
 * @param entityPropName {string} The name of the prop by which the entity will be provided to the component. The entity
 *     is provided to the viewer component using the same prop name.
 * @param EditorComponent {Component} The editor component. Shown when there is an active edit for the editor type and ID.
 * @param ViewerComponent {Component} The viewer component. Shown when there is no active edit for the editor type and ID.
 * @returns {Component} An editable entity component
 */
export default function withEditableEntity(editorType, entityPropName, EditorComponent, ViewerComponent) {
  class EditableEntity extends Component {

    static propTypes = {
      /** Required for the CircularProgress */
      id: PropTypes.string.isRequired,
      /** Identifies the editor's state */
      editorId: PropTypes.string,
      /** If omitted, no autocomplete */
      suggestionsKey: PropTypes.string,
      [entityPropName]: PropTypes.object,
    }

    static defaultProps = {
      showStatusText: true,
    }

    render() {
      const {
        id,
        textId,
        editorId,
        suggestionsKey,
        isFetching,
        isEditing,
        showStatusText,
        // ignore
        dispatch,
        ...rest
      } = this.props
      const entity = this.props[entityPropName]

      // lazy because editorId may not be available
      const editor = () => (
        <EditorComponent
          {...rest}
          editorId={editorId}
          id={id}
          suggestionsKey={suggestionsKey}
          disabled={isFetching}
        />
      )

      const viewer = (
        <ViewerComponent
          {...rest}
          id={id}
          showStatusText={showStatusText}
        />
      )

      const progress = (
        <CircularProgress id={`${id}--loading`} />
      )

      return isEditing ?
        editor() :
        !entity ? progress : viewer
    }
  }

  const mapStateToProps = (state, ownProps) => {
    const editorId = ownProps.editorId
    const {editEntity, isFetching} = editorId ?
      get(state.editors, [editorType, editorId], {}) :
      {}
    const isEditing = isTruthy(editEntity)
    return {
      isFetching,
      isEditing,
    }
  }

  return connect(mapStateToProps)(EditableEntity)
}



