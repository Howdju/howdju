import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import EditableStatement from './EditableStatement'

export default class StatementEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      className,
      statement,
      editorId,
      suggestionsKey,
      menu,
      showStatusText,
      doShowControls,
      trailStatements,
      showJustificationCount,
    } = this.props
    return (
      <EntityViewer
        iconName="short_text"
        className={className}
        iconTitle="Statement"
        component={component}
        entity={
          <EditableStatement
            id={id}
            statement={statement}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            trailStatements={trailStatements}
            showJustificationCount={showJustificationCount}
          />
        }
        menu={doShowControls && menu}
      />
    )
  }
}
StatementEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
}
StatementEntityViewer.defaultProps ={
  showStatusText: true,
  showJustificationCount: true,
}