import React, {Component} from 'react'
import FlipMove from 'react-flip-move';
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import cn from 'classnames'

import {
  JustificationPolarity,
} from './models'
import config from './config'
import JustificationTree from './JustificationTree'

import './StatementJustificationTrees.scss'
import {isNarrow} from "./util";

class StatementJustificationTrees extends Component {

  toTree = j => {
    const {
      id,
      doShowControls,
      doShowJustifications,
      isCondensed,
    } = this.props
    const treeId = `${id}-justification-tree-${j.id}`
    return <JustificationTree key={treeId}
                              justification={j}
                              doShowControls={doShowControls}
                              doShowBasisJustifications={doShowJustifications}
                              isCondensed={isCondensed}
    />
  }

  render() {
    const {
      justifications,
      isCondensed,
      WrapperComponent,
      className,
    } = this.props
    const {
      flipMoveDuration,
      flipMoveEasing
    } = config.ui.statementJustifications


    const _isNarrow = isNarrow()
    const justificationsByPolarity = groupBy(justifications, j => j.polarity)
    const positiveJustifications = get(justificationsByPolarity, JustificationPolarity.POSITIVE, [])
    const negativeJustifications = get(justificationsByPolarity, JustificationPolarity.NEGATIVE, [])
    const hasBothSides = positiveJustifications.length > 0 && negativeJustifications.length > 0
    const hasJustifications = justifications && justifications.length > 0

    /*
     When there are both positive and negative justifications, don't add any margin, but split them into two columns

     When there are only positive or only negative justifications, add a margin to the top-left justifications to show
     spatially whether they are positive or negative.
     */
    let treeCells = null
    if (!_isNarrow && hasBothSides || !isCondensed) {
      const positiveTreeClass = "statement-justifications-justification-trees--positive"
      const negativeTreeClass = "statement-justifications-justification-trees--negative"
      treeCells = [
        <FlipMove key={positiveTreeClass}
                  className={`md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone ${positiveTreeClass}`}
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
        >
          {map(positiveJustifications, this.toTree)}
        </FlipMove>,
        <FlipMove key={negativeTreeClass}
                  className={`md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone ${negativeTreeClass}`}
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
        >
          {map(negativeJustifications, this.toTree)}
        </FlipMove>
      ]
    } else if (hasJustifications) {
      const treesClass = "statement-justifications-justification-trees--combined"
      treeCells = (
          <FlipMove key={treesClass}
                    className={`md-cell md-cell--12 ${treesClass}`}
                    duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {map(justifications, this.toTree)}
          </FlipMove>
      )
    }

    return (
        <WrapperComponent className={cn(className, "md-grid")}>
          {treeCells}
        </WrapperComponent>
    )
  }
}
StatementJustificationTrees.defaultProps = {
  doShowControls: false,
  doShowJustifications: false,
  isCondensed: false,
  WrapperComponent: 'div',
}

export default StatementJustificationTrees
