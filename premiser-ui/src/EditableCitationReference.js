import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import CircularProgress from "react-md/lib/Progress/CircularProgress";
import get from 'lodash/get'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors";
import CitationReferenceViewer from "./CitationReferenceViewer";
import CitationReferenceEditor from "./CitationReferenceEditor";

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
        <CitationReferenceEditor id={id}
                                 editorId={editorId}
                                 suggestionsKey={suggestionsKey}
        />
    const viewer =
        <CitationReferenceViewer {...rest}
                                 id={id}
                                 citationReference={citationReference}
        />
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
  const citationReference = state.entities.citationReferences[ownProps.entityId]
  const editEntity = get(state.editors, [EditorTypes.CITATION_REFERENCE, ownProps.editorId, 'editEntity'])
  const isEditing = !!editEntity
  return {
    citationReference,
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(EditableCitationReference)