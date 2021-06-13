import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'

/**
 *
 * @param EntityComponent {Component} The component for rendering the entity
 * @param entityPropName {string} The prop name of the entity
 * @param entityLinkFn {function<object,string>} creates a link to an entity. Only called when the entity is truthy.
 * @returns {Component}
 */
export default function(EntityComponent, entityPropName, entityLinkFn) {
  return class extends Component {
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
        editorId,
        suggestionsKey,
        menu,
        showStatusText,
      } = this.props
      const entity = this.props[entityPropName]
      return (
        <EntityViewer
          iconName="person"
          iconTitle="Person/Organization"
          iconLink={entity && entityLinkFn(entity)}
          className={className}
          component={component}
          entity={
            <EntityComponent
              id={id}
              {...{[entityPropName]: entity}}
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
}
