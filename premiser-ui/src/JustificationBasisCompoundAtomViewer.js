import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
} from 'howdju-common'

import StatementAtomViewer from './StatementAtomViewer'
import SourceExcerptParaphraseAtomViewer from './SourceExcerptParaphraseAtomViewer'

export default class JustificationBasisCompoundAtomViewer extends Component {
  render() {
    const {
      id,
      atom,
      component,
      statementEditorId,
      paraphrasingStatementEditorId,
      sourceExcerptEditorId,
    } = this.props

    const entityViewerId = `${id}-entity`

    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT:
        return (
          <StatementAtomViewer
            id={entityViewerId}
            component={component}
            editorId={statementEditorId}
            atom={atom}
          />
        )
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        return (
          <SourceExcerptParaphraseAtomViewer
            id={entityViewerId}
            component={component}
            paraphrasingStatementEditorId={paraphrasingStatementEditorId}
            sourceExcerptEditorId={sourceExcerptEditorId}
            atom={atom}
          />
        )
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
    }
  }
}
JustificationBasisCompoundAtomViewer.propTypes = {
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  component: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]).isRequired,
  statementEditorId: PropTypes.string.isRequired,
  paraphrasingStatementEditorId: PropTypes.string.isRequired,
  sourceExcerptEditorId: PropTypes.string.isRequired,
}
