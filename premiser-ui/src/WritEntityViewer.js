import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import EditableWrit from './EditableWrit'

export default class WritEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      writ,
      editorId,
      suggestionsKey,
      menu,
    } = this.props
    return (
      <EntityViewer
        iconName="book"
        iconTitle="Writ"
        component={component}
        entity={
          <EditableWrit
            id={id}
            writ={writ}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
          />
        }
        menu={menu}
      />
    )
  }
}
WritEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
}
