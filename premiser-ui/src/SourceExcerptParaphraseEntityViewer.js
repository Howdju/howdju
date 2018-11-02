import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Divider} from 'react-md'

import {
  sourceExcerptDescription,
  combineIds,
} from './viewModels'

import EntityViewer from './EntityViewer'
import SourceExcerptEntityViewer from './SourceExcerptEntityViewer'
import EditableProposition from './EditableProposition'

import './SourceExcerptParaphraseEntityViewer.scss'


export default class SourceExcerptParaphraseEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      sourceExcerptParaphrase,
      paraphrasingPropositionEditorId,
      sourceExcerptEditorId,
      suggestionsKey,
      showStatusText,
      showUrls,
      trailPropositions
    } = this.props
    const {
      paraphrasingProposition,
      sourceExcerpt
    } = sourceExcerptParaphrase
    return (
      <EntityViewer
        className="source-excerpt-paraphrase-entity-viewer"
        component={component}
        iconName="textsms"
        iconTitle={`Paraphrase (${sourceExcerptDescription(sourceExcerpt)})`}
        entity={
          <div>
            <EditableProposition
              id={combineIds(id, 'proposition')}
              proposition={paraphrasingProposition}
              editorId={paraphrasingPropositionEditorId}
              suggestionsKey={suggestionsKey + '-paraphrasing-proposition'}
              showStatusText={showStatusText}
              trailPropositions={trailPropositions}
            />
            <div className="divider-wrapper">
              <Divider className="divider" inset/>
            </div>
            <SourceExcerptEntityViewer
              id={combineIds(id, 'source-excerpt')}
              sourceExcerpt={sourceExcerpt}
              editorId={sourceExcerptEditorId}
              suggestionsKey={suggestionsKey + '-source-excerpt'}
              showStatusText={showStatusText}
              showUrls={showUrls}
            />
          </div>
        }
      />
    )
  }
}
SourceExcerptParaphraseEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
  paraphrasingPropositionEditorId: PropTypes.string,
  sourceExcerptEditorId: PropTypes.string,
}
