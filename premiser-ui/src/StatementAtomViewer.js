import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import EditableStatement from './EditableStatement'

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
      editorId,
    } = this.props
    const {
      isOver
    } = this.state

    const statement = atom.entity

    return (
      <span className={cn("statement-atom-viewer", {
        active: isOver,
      })}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
      >
        <EditableStatement id={`${id}-statement`}
                           entityId={statement.id}
                           editorId={editorId}
                           textId={`${id}-statementText`}
                           suggestionsKey={`${id}-statementSuggestions`}
        />
      </span>
    )
  }
}
StatementAtomViewer.propTypes = {
  atom: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  editorId: PropTypes.string.isRequired,
}
