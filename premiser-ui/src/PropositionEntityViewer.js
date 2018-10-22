import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import EditableProposition from './EditableProposition'

export default class PropositionEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      className,
      proposition,
      editorId,
      suggestionsKey,
      menu,
      showStatusText,
      doShowControls,
      trailPropositions,
      showJustificationCount,
    } = this.props
    return (
      <EntityViewer
        iconName="short_text"
        className={className}
        iconTitle="Proposition"
        component={component}
        entity={
          <EditableProposition
            id={id}
            proposition={proposition}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            trailPropositions={trailPropositions}
            showJustificationCount={showJustificationCount}
          />
        }
        menu={doShowControls && menu}
      />
    )
  }
}
PropositionEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
}
PropositionEntityViewer.defaultProps ={
  showStatusText: true,
  showJustificationCount: true,
}