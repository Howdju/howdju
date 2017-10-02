import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import FlipMove from 'react-flip-move'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import cn from 'classnames'
import Button from 'react-md/lib/Buttons/Button'

import {
  JustificationPolarity,
} from 'howdju-common'
import config from './config'
import JustificationBranch from './JustificationBranch'
import {selectIsWindowNarrow} from "./selectors"
import t, {
  ADD_JUSTIFICATION_CALL_TO_ACTION
} from './texts'

import './JustificationsTree.scss'

class JustificationsTree extends Component {

  toBranch = j => {
    const {
      id,
      doShowControls,
      doShowJustifications,
      isCondensed,
      isUnCondensed,
      showBasisUrls,
    } = this.props
    const treeId = `${id}-justification-tree-${j.id}`
    return <JustificationBranch
      key={treeId}
      justification={j}
      doShowControls={doShowControls}
      doShowBasisJustifications={doShowJustifications}
      isCondensed={isCondensed}
      isUnCondensed={isUnCondensed}
      showBasisUrls={showBasisUrls}
    />
  }

  render() {
    const {
      justifications,
      isCondensed,
      isUnCondensed,
      wrapperComponent: WrapperComponent,
      className,
      isWindowNarrow,
      showNewPositiveJustificationDialog,
      showNewNegativeJustificationDialog,
    } = this.props
    const {
      flipMoveDuration,
      flipMoveEasing
    } = config.ui

    const justificationsByPolarity = groupBy(justifications, j => j.polarity)
    const positiveJustifications = get(justificationsByPolarity, JustificationPolarity.POSITIVE, [])
    const negativeJustifications = get(justificationsByPolarity, JustificationPolarity.NEGATIVE, [])
    const hasPositiveJustifications = positiveJustifications.length > 0
    const hasNegativeJustifications = negativeJustifications.length > 0
    const hasBothSides = hasPositiveJustifications && hasNegativeJustifications
    const hasJustifications = positiveJustifications.length > 0 || negativeJustifications.length > 0

    /*
     When there are both positive and negative justifications, don't add any margin, but split them into two columns

     When there are only positive or only negative justifications, add a margin to the top-left justifications to show
     spatially whether they are positive or negative.
     */
    let branchesCells = null
    if (isWindowNarrow || isCondensed || !hasBothSides && !isUnCondensed) {
      const treesClass = "statement-justifications-justification-trees--combined"
      branchesCells = (
        <FlipMove
          key={treesClass}
          className={`md-cell md-cell--12 ${treesClass}`}
          duration={flipMoveDuration}
          easing={flipMoveEasing}
        >
          {map(justifications, this.toBranch)}
        </FlipMove>
      )
    } else {
      const positiveTreeClass = "statement-justifications-justification-trees--positive"
      const negativeTreeClass = "statement-justifications-justification-trees--negative"
      branchesCells = [
        <FlipMove
          key={positiveTreeClass}
          className={`md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone ${positiveTreeClass}`}
          duration={flipMoveDuration}
          easing={flipMoveEasing}
        >
          {hasJustifications && (
            <h2 className="md-cell md-cell--12" key="supporting-justifications-header">
              Supporting Justifications
            </h2>
          )}
          {hasJustifications && !hasPositiveJustifications && ([
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-statements-page-no-positive-justifications-message"
            >
              <div>None</div>
            </div>,
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-statements-page-no-positive-justifications-add-justification-button"
            >
              <Button flat
                      label={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={showNewPositiveJustificationDialog}
              />
            </div>
          ])}
          {map(positiveJustifications, this.toBranch)}
        </FlipMove>,
        <FlipMove
          key={negativeTreeClass}
          className={`md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone ${negativeTreeClass}`}
          duration={flipMoveDuration}
          easing={flipMoveEasing}
        >
          {hasJustifications && (
            <h2 className="md-cell md-cell--12" key="opposting-justifications-header">
              Opposing Justifications
            </h2>
          )}
          {hasJustifications && !hasNegativeJustifications && ([
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-statements-page-no-negative-justifications-message"
            >
              None
            </div>,
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-statements-page-no-negative-justifications-add-justification-button"
            >
              <Button flat
                      label={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={showNewNegativeJustificationDialog}
              />
            </div>
          ])}
          {map(negativeJustifications, this.toBranch)}
        </FlipMove>
      ]
    }

    return (
      <WrapperComponent className={cn(className, "md-grid")}>
        {branchesCells}
      </WrapperComponent>
    )
  }
}
JustificationsTree.propTypes = {
  justifications: PropTypes.arrayOf(PropTypes.object),
  doShowControls: PropTypes.bool,
  doShowJustifications: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
  showNewPositiveJustificationDialog: PropTypes.func,
  showNewNegativeJustificationDialog: PropTypes.func,
  wrapperComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.string,
  ]),
}
JustificationsTree.defaultProps = {
  doShowControls: false,
  doShowJustifications: false,
  isCondensed: false,
  isUnCondensed: false,
  wrapperComponent: 'div',
}

const mapStateToProps = (state, ownProps) => {
  const isWindowNarrow = selectIsWindowNarrow(state)

  return {
    isWindowNarrow,
  }
}

export default connect(mapStateToProps)(JustificationsTree)
