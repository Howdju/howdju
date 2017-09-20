import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import EditableStatement from './EditableStatement'
import EditableSourceExcerpt from './EditableSourceExcerpt'

import './StatementAtomViewer.scss'

export default class StatementAtomViewer extends Component {

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
      paraphrasingStatementEditorId,
      sourceExcerptEditorId,
      suggestionsKey,
    } = this.props
    const {
      isOver
    } = this.state

    const {
      paraphrasingStatement,
      sourceExcerpt
    } = atom.entity

    return (
      <span className={cn("source-excerpt-paraphrase-atom-viewer", {
        active: isOver,
      })}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
      >
        <EditableStatement id={`${id}-statement`}
                           entityId={paraphrasingStatement.id}
                           editorId={paraphrasingStatementEditorId}
                           suggestionsKey={suggestionsKey + '-paraphrasing-statement'}
        />
        <EditableSourceExcerpt id={id + '-source-excerpt'}
                               sourceExcerpt={sourceExcerpt}
                               editorId={sourceExcerptEditorId}
                               suggestionsKey={suggestionsKey + '-source-excerpt'}
        />
      </span>
    )
  }
}
StatementAtomViewer.propTypes = {
  atom: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  sourceExcerptEditorId: PropTypes.string.isRequired,
  paraphrasingStatementEditorId: PropTypes.string.isRequired,
  suggestionsKey: PropTypes.string,
}
