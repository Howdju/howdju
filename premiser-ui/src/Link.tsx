import React, { ReactNode } from "react";
import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
} from "react-router-dom";

import { isAbsoluteUrl } from "howdju-common";

import "./Link.scss";

interface LinkProps extends ReactRouterLinkProps {
  children: ReactNode;
  newWindow?: boolean;
}

export default function Link(props: LinkProps) {
  const { children, newWindow, ...rest } = props;
  const linkProps = {} as Partial<ReactRouterLinkProps>;
  if (newWindow) {
    linkProps.target = "_blank";
  }
  if (isAbsoluteUrl(props.to)) {
    linkProps.target = "_blank";
    return (
      <a {...rest} {...linkProps} href={props.to}>
        {children}
      </a>
    );
  }
  return (
    <ReactRouterLink {...rest} {...linkProps}>
      {children}
    </ReactRouterLink>
  );
}
