import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontIcon } from "react-md";
import cn from "classnames";

import "./EntityViewer.scss";
import { Link } from "react-router-dom";

export default class EntityViewer extends Component {
  render() {
    const {
      className,
      iconName,
      iconTitle,
      iconLink,
      entity,
      menu,
      component: Component,
    } = this.props;

    let header = (
      <FontIcon role="presentation" title={iconTitle}>
        {iconName}
      </FontIcon>
    );
    if (iconLink) {
      header = <Link to={iconLink}>{header}</Link>;
    }

    return (
      <Component className={cn(className, "entity-viewer")}>
        <div className="entity-viewer--header">{header}</div>
        <div className="entity-viewer--entity">{entity}</div>
        {menu}
      </Component>
    );
  }
}
EntityViewer.propTypes = {
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};
EntityViewer.defaultProps = {
  component: "div",
};
