import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {
  JustificationBasisType,
  newExhaustedEnumError,
} from "howdju-common"

import EditableStatementCompound from "./EditableStatementCompound"
import EditableJustificationBasisCompound from './EditableJustificationBasisCompound'
import EditableWritQuote from "./EditableWritQuote"


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
    const basis = justification.basis

    switch (basis.type) {
      case JustificationBasisType.STATEMENT_COMPOUND:
        return (
          <EditableStatementCompound {...rest}
                                     id={id}
                                     entityId={basis.entity.id}
                                     editorId={editorId}
                                     suggestionsKey={suggestionsKey}
                                     doShowControls={doShowControls}
                                     doShowStatementAtomJustifications={doShowBasisJustifications}
                                     isCondensed={isCondensed}
                                     isUnCondensed={isUnCondensed}
          />
        )
      case JustificationBasisType.WRIT_QUOTE:
        return (
          <EditableWritQuote {...rest}
                             id={id}
                             entityId={basis.entity.id}
                             editorId={editorId}
                             suggestionsKey={suggestionsKey}
                             doShowControls={doShowControls}
          />
        )
      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        return (
          <EditableJustificationBasisCompound {...rest}
                                              id={id}
                                              entityId={basis.entity.id}
                                              editorId={editorId}
                                              suggestionsKey={suggestionsKey}
                                              doShowControls={doShowControls}
                                              doShowStatementAtomJustifications={doShowBasisJustifications}
                                              isCondensed={isCondensed}
                                              isUnCondensed={isUnCondensed}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisType', basis.type)
    }
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