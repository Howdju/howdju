import React, {Component} from "react"
import PropTypes from 'prop-types'
import {Card, CardText} from 'react-md'
import cn from 'classnames'

import './JustificationCard.scss'
import JustificationEntityViewer from './JustificationEntityViewer'


export default class JustificationCard extends Component {

  static propTypes = {
    // Whether to show the justification's root target and counter-justification's target
    doShowTargets: PropTypes.bool,
  }

  static defaultProps = {
    doShowTargets: true,
    showBasisUrls: false,
  }

  render() {
    const {
      id,
      justification,
      doShowBasisJustifications,
      doShowControls,
      showStatusText,
      onExpandJustifications,
      className,
      showBasisUrls,
      doShowTargets,
      onClickWritQuoteUrl,
      ...rest
    } = this.props

    return (
      <Card
        {...rest}
        className={cn(className, 'entity-card')}
      >
        <CardText>
          <JustificationEntityViewer
            id={id}
            justification={justification}
            doShowBasisJustifications={doShowBasisJustifications}
            doShowControls={doShowControls}
            onExpandJustifications={onExpandJustifications}
            showBasisUrls={showBasisUrls}
            doShowRootTarget={doShowTargets}
            doShowCounterTarget={doShowTargets}
            onClickWritQuoteUrl={onClickWritQuoteUrl}
            showStatusText={showStatusText}
          />
        </CardText>
      </Card>
    )
  }
}
