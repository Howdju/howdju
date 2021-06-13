import Helmet from "react-helmet"
import React from "react"

const HowdjuHelmet = (props) =>
  // defer=false causes Helmet to load the title in the background, before the tab is activated.
  // Otherwise Helmet waits for requestAnimationFrame to take action.
  <Helmet defer={false} {...props}>
    {props.children}
  </Helmet>

export default HowdjuHelmet
