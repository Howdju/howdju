import React from "react"
import {Link} from "react-router-dom"

import './Link.scss'

const HowdjuLink = (props) => {
  const {
    children,
    newWindow,
    ...rest
  } = props
  const linkProps = {}
  if (newWindow) {
    linkProps.target = '_blank'
  }
  return (
    <Link {...rest} {...linkProps}>
      {children}
    </Link>
  )
}


export default HowdjuLink
