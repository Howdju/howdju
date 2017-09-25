import React, {Component} from 'react'
import PropTypes from 'prop-types'
import upperFirst from 'lodash/upperFirst'

import EntityViewer from './EntityViewer'
import EditableStatement from './EditableStatement'
import EditableSourceExcerpt from './EditableSourceExcerpt'
import {
  sourceExcerptDescription,
  sourceExcerptIconName,
} from './viewModels'

export default class SourceExcerptParaphraseAtomViewer extends Component {

  constructor() {
    super()

    this.state = {isOver: false}
  }

  onMouseOver = () => {
    this.setState({isOver: true})
  }

  onMouseLeave = () => {
    this.setState({isOver: false})
  }

  render() {
    const {
      atom,
      id,
      component,
      paraphrasingStatementEditorId,
      sourceExcerptEditorId,
      suggestionsKey,
    } = this.props
    const {
      isOver
    } = this.state
    const {
      entity: sourceExcerptParaphrase
    } = atom
    const {
      paraphrasingStatement,
      sourceExcerpt
    } = sourceExcerptParaphrase

    return (
      <EntityViewer
        className="atom-viewer source-excerpt-paraphrase-atom-viewer"
        active={isOver}
        component={component}
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
        iconName="textsms"
        iconTitle={`Paraphrase (${sourceExcerptDescription(sourceExcerpt)})`}
        entity={
          <div>
            <EditableStatement
              id={`${id}-statement`}
              entityId={paraphrasingStatement.id}
              editorId={paraphrasingStatementEditorId}
              suggestionsKey={suggestionsKey + '-paraphrasing-statement'}
            />
            <EntityViewer
              iconName={sourceExcerptIconName(sourceExcerpt)}
              iconTitle={upperFirst(sourceExcerptDescription(sourceExcerpt))}
              component={component}
              entity={
                <EditableSourceExcerpt
                  id={id + '-source-excerpt'}
                  className="entity-description"
                  sourceExcerpt={sourceExcerpt}
                  editorId={sourceExcerptEditorId}
                  suggestionsKey={suggestionsKey + '-source-excerpt'}
                />
              }
            />
          </div>
        }
      />
    )
  }
}
SourceExcerptParaphraseAtomViewer.propTypes = {
  atom: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  sourceExcerptEditorId: PropTypes.string.isRequired,
  paraphrasingStatementEditorId: PropTypes.string.isRequired,
  suggestionsKey: PropTypes.string,
}
