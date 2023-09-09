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

export default function Link({ children, newWindow, to, ...rest }: LinkProps) {
  const linkProps = {} as Partial<ReactRouterLinkProps>;
  if (newWindow) {
    linkProps.target = "_blank";
  }
  if (isAbsoluteUrl(to)) {
    linkProps.target = "_blank";
    return (
      <a {...rest} {...linkProps} href={to}>
        {children}
      </a>
    );
  }
  return (
    <ReactRouterLink to={to} {...rest} {...linkProps}>
      {children}
    </ReactRouterLink>
  );
}
