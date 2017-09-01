import React, {Component} from 'react'
import PropTypes from 'prop-types'
import EditableStatementCompound from "./EditableStatementCompound"
import EditableCitationReference from "./EditableCitationReference"
import {isStatementCompoundBased} from "howdju-common"

class EditableJustificationBasis extends Component {

  render() {
    const {
      id,
      justification,
      editorId,
      suggestionsKey,
      doShowControls,
      doShowBasisJustifications,
      isCondensed,
      isUnCondensed,
      ...rest,
    } = this.props

    return isStatementCompoundBased(justification) ?
      <EditableStatementCompound {...rest}
                                 id={id}
                                 entityId={justification.basis.entity.id}
                                 editorId={editorId}
                                 suggestionsKey={suggestionsKey}
                                 doShowControls={doShowControls}
                                 doShowStatementAtomJustifications={doShowBasisJustifications}
                                 isCondensed={isCondensed}
                                 isUnCondensed={isUnCondensed}
      /> :
      <EditableCitationReference {...rest}
                                 id={id}
                                 entityId={justification.basis.entity.id}
                                 editorId={editorId}
                                 suggestionsKey={suggestionsKey}
                                 doShowControls={doShowControls}
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