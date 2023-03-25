import React, { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { FontIcon } from "react-md";
import cn from "classnames";

import "./EntityViewer.scss";

interface Props {
  entity: ReactNode;
  iconName: string;
  iconTitle: string;
  className?: string;
  iconLink?: string;
  menu?: ReactNode;
  doShowControls?: boolean;
  component?: ComponentType | string;
}

export default function EntityViewer({
  className,
  iconName,
  iconTitle,
  iconLink,
  entity,
  menu,
  component: Component = "div",
  doShowControls = true,
}: Props) {
  // TODO(304) pass title directly to a component that supports it
  const titleProps = { title: iconTitle } as any;
  let header = (
    <FontIcon {...titleProps} role="presentation">
      {iconName}
    </FontIcon>
  );
  if (iconLink) {
    header = <Link to={iconLink}>{header}</Link>;
  }

  // TODO(304) pass className directly to a component that supports it
  const classNameProps = { className: cn(className, "entity-viewer") };
  return (
    <Component {...classNameProps}>
      <div className="entity-viewer--header">{header}</div>
      <div className="entity-viewer--entity">{entity}</div>
      {doShowControls && menu}
    </Component>
  );
}
