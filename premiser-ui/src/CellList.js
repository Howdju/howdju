import React, { Component } from 'react'
import FlipMove from 'react-flip-move'

import config from './config'

export default class CellList extends Component {

  static smallCellClasses = "md-cell md-cell--3 md-cell--8-tablet md-cell--4-phone"
  static largeCellClasses = "md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone"

  render () {
    const {
      children,
      ...rest,
    } = this.props
    const flipMoveProps = config.ui.flipMove

    return (
      <FlipMove
        {...flipMoveProps}
        {...rest}
      >
        {children}
      </FlipMove>
    )
  }
}
