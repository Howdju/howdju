import React from 'react'
import {connect} from 'react-redux'

import {selectIsWindowNarrow} from './selectors'

export default function windowAware(WrappedComponent) {
  class WindowAware extends React.Component {
    render() {
      const {
        isWindowNarrow,
        ...rest
      } = this.props
      return (
        <WrappedComponent
          {...rest}
          isWindowNarrow={isWindowNarrow}
        />
      )
    }
  }
  WindowAware.displayName = `WindowAware(${getDisplayName(WrappedComponent)})`

  // TODO why can't this be pure?  (Otherwise React is not re-rendering wrapped components)
  return connect(mapStateToProps, null, null, {pure: false})(WindowAware)
}

function mapStateToProps(state) {
  return {
    isWindowNarrow: selectIsWindowNarrow(state)
  }
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}