import React from 'react'
import {connect} from 'react-redux'

import {selectCanHover} from './selectors'
import {getComponentDisplayName} from './util'

export default function hoverAware(WrappedComponent) {
  class HoverAware extends React.Component {
    render() {
      const {
        canHover,
        ...rest
      } = this.props
      return (
        <WrappedComponent
          {...rest}
          canHover={canHover}
        />
      )
    }
  }
  HoverAware.displayName = `HoverAware(${getComponentDisplayName(WrappedComponent)})`

  // TODO why can't this be pure?  (Otherwise React is not re-rendering wrapped components)
  return connect(mapStateToProps, null, null, {pure: false})(HoverAware)
}

function mapStateToProps(state) {
  return {
    canHover: selectCanHover(state)
  }
}
