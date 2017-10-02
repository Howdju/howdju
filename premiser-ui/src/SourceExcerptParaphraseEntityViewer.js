import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Divider from 'react-md/lib/Dividers/Divider'

import {
  sourceExcerptDescription,
} from './viewModels'

import EntityViewer from './EntityViewer'
import SourceExcerptEntityViewer from './SourceExcerptEntityViewer'
import StatementEntityViewer from './StatementEntityViewer'

import './SourceExcerptParaphraseEntityViewer.scss'


export default class SourceExcerptParaphraseEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      sourceExcerptParaphrase,
      paraphrasingStatementEditorId,
      sourceExcerptEditorId,
      suggestionsKey,
      showStatusText,
    } = this.props
    const {
      paraphrasingStatement,
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
            <StatementEntityViewer
              id={`${id}-statement`}
              statement={paraphrasingStatement}
              editorId={paraphrasingStatementEditorId}
              suggestionsKey={suggestionsKey + '-paraphrasing-statement'}
              showStatusText={showStatusText}
            />
            <div className="divider-wrapper">
              <Divider className="divider" inset/>
            </div>
            <SourceExcerptEntityViewer
              id={id + '-source-excerpt'}
              sourceExcerpt={sourceExcerpt}
              editorId={sourceExcerptEditorId}
              suggestionsKey={suggestionsKey + '-source-excerpt'}
              showStatusText={showStatusText}
            />
          </div>
        }
      />
    )
  }
}
SourceExcerptParaphraseEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
  paraphrasingStatementEditorId: PropTypes.string,
  sourceExcerptEditorId: PropTypes.string,
}
