import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
} from 'howdju-common'

import StatementEntityViewer from './StatementEntityViewer'
import SourceExcerptParaphraseEntityViewer from './SourceExcerptParaphraseEntityViewer'

export default class JustificationBasisCompoundAtomViewer extends Component {
  render() {
    const {
      id,
      atom,
      component,
      statementEditorId,
      paraphrasingStatementEditorId,
      sourceExcerptEditorId,
      doShowControls,
      showStatusText,
      showUrls,
    } = this.props

    const entityViewerId = `${id}-entity`

    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT:
        return (
          <StatementEntityViewer
            component={component}
            id={entityViewerId}
            statement={atom.entity}
            editorId={statementEditorId}
            suggestionsKey={`${id}-statement-suggestions`}
            doShowControls={doShowControls}
            showStatusText={showStatusText}
          />
        )
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        return (
          <SourceExcerptParaphraseEntityViewer
            component={component}
            id={entityViewerId}
            sourceExcerptParaphrase={atom.entity}
            paraphrasingStatementEditorId={paraphrasingStatementEditorId}
            sourceExcerptEditorId={sourceExcerptEditorId}
            suggestionsKey={`${id}-source-excerpt-paraphrase-suggestions`}
            doShowControls={doShowControls}
            showStatusText={showStatusText}
            showUrls={showUrls}
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
  paraphrasingStatementEditorId: PropTypes.string,
  sourceExcerptEditorId: PropTypes.string,
}
