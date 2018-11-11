import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
} from 'howdju-common'

import {combineIds} from './viewModels'
import PropositionEntityViewer from './PropositionEntityViewer'
import SourceExcerptParaphraseEntityViewer from './SourceExcerptParaphraseEntityViewer'

export default class JustificationBasisCompoundAtomViewer extends Component {
  render() {
    const {
      id,
      atom,
      component,
      propositionEditorId,
      paraphrasingPropositionEditorId,
      sourceExcerptEditorId,
      doShowControls,
      showStatusText,
      showUrls,
      contextTrailItems,
    } = this.props

    const entityViewerId = combineIds(id, 'entity')

    switch (atom.type) {
      case JustificationBasisCompoundAtomType.PROPOSITION:
        return (
          <PropositionEntityViewer
            component={component}
            id={entityViewerId}
            proposition={atom.entity}
            editorId={propositionEditorId}
            suggestionsKey={`${id}-proposition-suggestions`}
            doShowControls={doShowControls}
            showStatusText={showStatusText}
            contextTrailItems={contextTrailItems}
          />
        )
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        return (
          <SourceExcerptParaphraseEntityViewer
            component={component}
            id={entityViewerId}
            sourceExcerptParaphrase={atom.entity}
            paraphrasingPropositionEditorId={paraphrasingPropositionEditorId}
            sourceExcerptEditorId={sourceExcerptEditorId}
            suggestionsKey={`${id}-source-excerpt-paraphrase-suggestions`}
            doShowControls={doShowControls}
            showStatusText={showStatusText}
            showUrls={showUrls}
            contextTrailItems={contextTrailItems}
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
  propositionEditorId: PropTypes.string.isRequired,
  paraphrasingPropositionEditorId: PropTypes.string,
  sourceExcerptEditorId: PropTypes.string,
}
