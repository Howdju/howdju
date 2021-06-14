import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'

/**
 *
 * @param EntityComponent {Component} The component for rendering the entity
 * @param entityPropName {string} The prop name of the entity
 * @param iconName {string} The icon name to use
 * @param iconTitle {string} The title to use for hte icon
 * @param entityLinkFn {function<object,string>} creates a link to an entity. Only called when the entity is truthy.
 * @returns {Component}
 */
export default function withEntityViewer(EntityComponent, entityPropName, iconName,
  iconTitle, entityLinkFn
) {
  return class EntityViewerWrapper extends Component {
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
          iconName={iconName}
          iconTitle={iconTitle}
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
