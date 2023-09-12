import React, { PropsWithChildren } from "react";
import Helmet, { HelmetProps } from "react-helmet";

const HowdjuHelmet = (props: PropsWithChildren<HelmetProps>) => (
  // defer=false causes Helmet to load the title in the background, before the tab is activated.
  // Otherwise Helmet waits for requestAnimationFrame to take action.
  <Helmet defer={false} {...props}>
    {props.children}
  </Helmet>
);

export default HowdjuHelmet;
