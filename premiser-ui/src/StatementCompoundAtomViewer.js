import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import EditableStatement from './EditableStatement'

import './StatementCompoundAtomViewer.scss'

class StatementCompoundAtomViewer extends Component {

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
      statementAtom,
      id,
      editorId,
    } = this.props
    const {
      isOver
    } = this.state

    const statement = statementAtom.statement

    return (
      <span className={cn("statement-compound-atom-viewer", {
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
StatementCompoundAtomViewer.propTypes = {
  statementAtom: PropTypes.object.isRequired,
}

export default StatementCompoundAtomViewer