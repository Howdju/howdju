import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import EditableStatement from './EditableStatement'
import EntityViewer from './EntityViewer'

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
      component,
      editorId,
    } = this.props
    const {
      isOver
    } = this.state

    const statement = atom.entity

    return (
      <EntityViewer
        className={cn('atom-viewer statement-atom-viewer', {
          active: isOver
        })}
        component={component}
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
        iconName="short_text"
        iconTitle="Statement"
        entity={
          <EditableStatement
            id={`${id}-editable-statement`}
            className="entity-description statement-text"
            entityId={statement.id}
            editorId={editorId}
            suggestionsKey={`${id}-statementSuggestions`}
          />
        }
      />
    )
  }
}
StatementAtomViewer.propTypes = {
  atom: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  editorId: PropTypes.string.isRequired,
  component: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]),
}
StatementAtomViewer.defaultProps = {
  component: 'div',
}
