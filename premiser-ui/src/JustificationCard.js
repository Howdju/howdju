import React, {Component} from "react"
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
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
          />
        </CardText>
      </Card>
    )
  }
}