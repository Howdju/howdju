import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import get from 'lodash/get'

import {EditorTypes} from "./reducers/editors"
import CitationReferenceViewer from "./CitationReferenceViewer"
import CitationReferenceEditor from "./CitationReferenceEditor"
import {denormalize} from "normalizr"
import {citationReferenceSchema} from "./schemas"
import ExpandableChildContainer from './ExpandableChildContainer'

class EditableCitationReference extends Component {

  render() {
    const {
      id,
      editorId,
      citationReference,
      suggestionsKey,
      isFetching,
      isEditing,
      ...rest
    } = this.props

    const editor =
      <CitationReferenceEditor {...rest}
                               id={id}
                               editorId={editorId}
                               suggestionsKey={suggestionsKey}
      />
    const viewer = (
      <ExpandableChildContainer {...rest}
                                ExpandableChildComponent={CitationReferenceViewer}
                                widgetId={id}
                                key={id}
                                citationReference={citationReference}
      />
    )
    const progress =
      <CircularProgress id={`${id}-Progress`} />

    return isEditing ?
      editor :
      isFetching ? progress : viewer
  }
}
EditableCitationReference.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Let's the component fetch its statement from the API and retrieve it from the state */
  entityId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}

const mapStateToProps = (state, ownProps) => {
  const citationReference = denormalize(state.entities.citationReferences[ownProps.entityId], citationReferenceSchema, state.entities)
  const editEntity = get(state.editors, [EditorTypes.CITATION_REFERENCE, ownProps.editorId, 'editEntity'])
  const isEditing = !!editEntity
  return {
    citationReference,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableCitationReference)