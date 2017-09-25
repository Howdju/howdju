import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'
import cn from 'classnames'

import './EntityViewer.scss'


export default class EntityViewer extends Component {
  render() {
    const {
      className,
      iconName,
      iconTitle,
      entity,
      menu,
      component: Component,
    } = this.props
    return (
      <Component className={cn(className, "entity-viewer")}>
        <FontIcon
          role="presentation"
          className="entity-viewer--icon"
          title={iconTitle}
        >{iconName}</FontIcon>
        <div className="entity-viewer--entity">
          {entity}
        </div>
        {menu}
      </Component>
    )
  }
}
EntityViewer.propTypes = {
  component: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]).isRequired,

}