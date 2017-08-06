import React, {Component} from 'react'
import FlipMove from 'react-flip-move';
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'

import {
  JustificationPolarity,
} from './models'
import config from './config'
import JustificationTree from './JustificationTree'

import './StatementJustifications.scss'

class StatementJustifications extends Component {

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
      statement,
      WrapperComponent,
      isCondensed,
    } = this.props
    const {
      flipMoveDuration,
      flipMoveEasing
    } = config.ui.statementJustifications

    const justificationsByPolarity = groupBy(statement.justifications, j => j.polarity)
    const positiveJustifications = get(justificationsByPolarity, JustificationPolarity.POSITIVE, [])
    const negativeJustifications = get(justificationsByPolarity, JustificationPolarity.NEGATIVE, [])

    /*
     When there are both positive and negative justifications, don't add any margin, but split them into two columns

     When there are only positive or only negative justifications, add a margin to the top-left justifications to show
     spatially whether they are positive or negative.
     */
    let contents
    if (
        positiveJustifications.length > 0 && negativeJustifications.length > 0
        || !isCondensed
    ) {
      contents = [
        <FlipMove key="statement-justifications-justification-trees--positive"
                  className="md-cell md-cell--6 md-cell--4-tablet"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
        >
          {map(positiveJustifications, this.toTree)}
        </FlipMove>,
        <FlipMove key="statement-justifications-justification-trees--negative"
                  className="md-cell md-cell--6 md-cell--4-tablet"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
        >
          {map(negativeJustifications, this.toTree)}
        </FlipMove>
      ]
    } else if (positiveJustifications.length > 0) {
      const nonEmptyJustifications = positiveJustifications.length > 0 ? positiveJustifications : negativeJustifications
      const treesClass = "statement-justifications-justification-trees--combined"
      contents = (
          <FlipMove key={treesClass}
                    className={treesClass}
                    duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {map(nonEmptyJustifications, this.toTree)}
          </FlipMove>
      )
    }

    return (
        <WrapperComponent className="md-grid">
          {contents}
        </WrapperComponent>
    )
  }
}
StatementJustifications.defaultProps = {
  WrapperComponent: 'div',
  isCondensed: false,
}

export default StatementJustifications
