import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FlipMove from 'react-flip-move'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import cn from 'classnames'
import {Button} from 'react-md'

import {
  JustificationPolarities,
} from 'howdju-common'

import config from './config'
import JustificationBranch from './JustificationBranch'
import t, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
} from './texts'
import windowAware from "./windowAware"

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
      contextTrailItems,
      onClickWritQuoteUrl,
    } = this.props
    const treeId = `${id}-justification-tree-${j.id}`
    return (
      <JustificationBranch
        key={treeId}
        justification={j}
        doShowControls={doShowControls}
        doShowBasisJustifications={doShowJustifications}
        isCondensed={isCondensed}
        isUnCondensed={isUnCondensed}
        showBasisUrls={showBasisUrls}
        contextTrailItems={contextTrailItems}
        onClickWritQuoteUrl={onClickWritQuoteUrl}
      />
    )
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

    const justificationsByPolarity = groupBy(justifications, j => j.polarity)
    const positiveJustifications = get(justificationsByPolarity, JustificationPolarities.POSITIVE, [])
    const negativeJustifications = get(justificationsByPolarity, JustificationPolarities.NEGATIVE, [])
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
      const treesClass = "proposition-justifications-justification-trees--combined"
      branchesCells = (
        <FlipMove
          {...config.ui.flipMove}
          key={treesClass}
          className={`md-cell md-cell--12 ${treesClass}`}
        >
          {hasJustifications && (
            <h2 className="md-cell md-cell--12" key="justifications-header">
              Justifications
            </h2>
          )}
          {map(justifications, this.toBranch)}
        </FlipMove>
      )
    } else {
      const positiveTreeClass = "proposition-justifications-justification-trees--positive"
      const negativeTreeClass = "proposition-justifications-justification-trees--negative"
      branchesCells = [
        <FlipMove
          {...config.ui.flipMove}
          key={positiveTreeClass}
          className={`md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone ${positiveTreeClass}`}
        >
          {hasJustifications && (
            <h2 className="md-cell md-cell--12" key="supporting-justifications-header">
              Supporting Justifications
            </h2>
          )}
          {hasJustifications && !hasPositiveJustifications && ([
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-propositions-page-no-positive-justifications-message"
            >
              <div>None</div>
            </div>,
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-propositions-page-no-positive-justifications-add-justification-button"
            >
              <Button flat
                      children={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={showNewPositiveJustificationDialog}
              />
            </div>,
          ])}
          {map(positiveJustifications, this.toBranch)}
        </FlipMove>,
        <FlipMove
          {...config.ui.flipMove}
          key={negativeTreeClass}
          className={`md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone ${negativeTreeClass}`}
        >
          {hasJustifications && (
            <h2 className="md-cell md-cell--12" key="opposting-justifications-header">
              Opposing Justifications
            </h2>
          )}
          {hasJustifications && !hasNegativeJustifications && ([
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-propositions-page-no-negative-justifications-message"
            >
              None
            </div>,
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-propositions-page-no-negative-justifications-add-justification-button"
            >
              <Button flat
                      children={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={showNewNegativeJustificationDialog}
              />
            </div>,
          ])}
          {map(negativeJustifications, this.toBranch)}
        </FlipMove>,
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

export default windowAware(JustificationsTree)
