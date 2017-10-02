import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import EditableStatement from './EditableStatement'

export default class StatementEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      statement,
      editorId,
      suggestionsKey,
      menu,
      showStatusText,
    } = this.props
    return (
      <EntityViewer
        iconName="short_text"
        iconTitle="Statement"
        component={component}
        entity={
          <EditableStatement
            id={id}
            statement={statement}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
          />
        }
        menu={menu}
      />
    )
  }
}
StatementEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
}
StatementEntityViewer.defaultProps ={
  showStatusText: true,
}