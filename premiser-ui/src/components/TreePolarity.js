import React from "react"
import cn from 'classnames'

import { JustificationPolarity } from "howdju-common"

import './TreePolarity.scss'

// Offsets and colors justifications in a tree according to their polarity.
export default class TreePolarityOffsetter extends React.Component {

  render() {
    const {
      polarity,
      children
    } = this.props

    const isPositive = polarity === JustificationPolarity.POSITIVE
    const isNegative = polarity === JustificationPolarity.NEGATIVE

    return (
      <div
        className={cn({
          'tree-polarity--positive': isPositive,
          'tree-polarity--negative': isNegative,
        })}>
        {children}
      </div>
    )
  }
}
