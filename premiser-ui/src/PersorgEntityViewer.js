import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import EditablePersorg from './EditablePersorg'
import paths from './paths'

export default class PersorgEntityViewer extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
  }

  static defaultProps = {
    showStatusText: true,
  }

  render() {
    const {
      component,
      id,
      className,
      persorg,
      editorId,
      suggestionsKey,
      menu,
      showStatusText,
    } = this.props
    return (
      <EntityViewer
        iconName="person"
        iconTitle="Person/Organization"
        iconLink={persorg && paths.persorg(persorg)}
        className={className}
        component={component}
        entity={
          <EditablePersorg
            id={id}
            persorg={persorg}
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