import React, {Component} from "react"
import {Card, CardText} from 'react-md'
import cn from 'classnames'

import './JustificationCard.scss'
import JustificationEntityViewer from './JustificationEntityViewer'


export default class JustificationCard extends Component {
  render() {
    const {
      id,
      justification,
      doShowBasisJustifications,
      doShowControls,
      onExpandJustifications,
      className,
      showBasisUrls,
      ...rest,
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
          />
        </CardText>
      </Card>
    )
  }
}
JustificationCard.defaultProps = {
  showBasisUrls: false,
}