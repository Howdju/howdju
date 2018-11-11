import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import StatementViewer from './StatementViewer'

export default class StatementEntityViewer extends Component {

  static propTypes = {
    id: PropTypes.string.isRequired,
  }

  static defaultProps ={
    showStatusText: true,
    showJustificationCount: true,
  }

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
      contextTrailItems,
      showJustificationCount,
    } = this.props
    return (
      <EntityViewer
        iconName="message"
        className={className}
        iconTitle="Statement"
        component={component}
        entity={
          <StatementViewer
            id={id}
            statement={statement}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            contextTrailItems={contextTrailItems}
            showJustificationCount={showJustificationCount}
          />
        }
        menu={menu}
      />
    )
  }
}