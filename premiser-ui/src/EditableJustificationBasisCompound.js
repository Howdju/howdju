import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import get from 'lodash/get'
import {denormalize} from "normalizr"

import {EditorTypes} from "./reducers/editors"
import JustificationBasisCompoundViewer from "./JustificationBasisCompoundViewer"
import {justificationBasisCompoundSchema} from "./schemas"

class EditableJustificationBasisCompound extends Component {

  render() {
    const {
      id,
      justificationBasisCompound,
      isFetching,
      // Currently statement compounds are not editable.  Only their statements are.  Instead create a new statement compound justification
      // isEditing,
      doShowControls,
      doShowStatementAtomJustifications,
      isCondensed,
      isUnCondensed,
      editorId,
      suggestionsKey,
      ...rest
    } = this.props

    const viewer =
      <JustificationBasisCompoundViewer {...rest}
                                        id={id}
                                        justificationBasisCompound={justificationBasisCompound}
                                        doShowControls={doShowControls}
                                        doShowStatementAtomJustifications={doShowStatementAtomJustifications}
                                        isCondensed={isCondensed}
                                        isUnCondensed={isUnCondensed}
      />
    const progress =
      <CircularProgress id={`${id}-Progress`} />

    return isFetching ? progress : viewer
  }
}
EditableJustificationBasisCompound.propTypes = {
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
  doShowControls: PropTypes.bool,
  doShowAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
}

const mapStateToProps = (state, ownProps) => {
  const normalJustificationBasisCompound = state.entities.justificationBasisCompounds[ownProps.entityId]
  const justificationBasisCompound = denormalize(normalJustificationBasisCompound, justificationBasisCompoundSchema, state.entities)
  const editEntity = get(state.editors, [EditorTypes.JUSTIFICATION_BASIS_COMPOUND, ownProps.editorId, 'editEntity'])
  const isEditing = !!editEntity

  return {
    justificationBasisCompound,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableJustificationBasisCompound)
