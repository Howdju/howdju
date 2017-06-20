import React, {Component} from 'react'
import PropTypes from 'prop-types'
import EditableStatement from "./EditableStatement";
import EditableCitationReference from "./EditableCitationReference";
import {isStatementBased} from "./models";

class EditableJustificationBasis extends Component {

  render() {
    const {
      id,
      justification,
      editorId,
      suggestionsKey,
      ...rest,
    } = this.props

    return isStatementBased(justification) ?
        <EditableStatement {...rest}
                           id={id}
                           entityId={justification.basis.entity.id}
                           editorId={editorId}
                           suggestionsKey={suggestionsKey}
        /> :
        <EditableCitationReference {...rest}
                                   id={id}
                                   entityId={justification.basis.entity.id}
                                   editorId={editorId}
                                   suggestionsKey={suggestionsKey}
        />
  }
}
EditableJustificationBasis.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  justification: PropTypes.object.isRequired,
  editorId: PropTypes.string,
  suggestionsKey: PropTypes.string,
}

export default EditableJustificationBasis