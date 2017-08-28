import React, {Component} from "react";
import { Link } from 'react-router-dom'
import Button from 'react-md/lib/Buttons/Button'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import FontIcon from 'react-md/lib/FontIcons'
import moment from 'moment'

import paths from './paths'
import {isCounter, isRootJustification} from "howdju-common"
import config from './config'
import JustificationChatBubble from "./JustificationChatBubble"

import './JustificationCard.scss'

export default class JustificationCard extends Component {
  render() {
    const {
      justification,
      doShowBasisJustifications,
      ...rest,
    } = this.props

    const age = justification.created ? moment(justification.created).fromNow() : ''
    // const age = moment.duration(moment(s.created).diff(now)).humanize(true)
    const created = justification.created ? moment(justification.created).format(config.humanDateTimeFormat) : ''

    const _isCounter = isCounter(justification)
    const _doesCounterRootJustification = _isCounter && isRootJustification(justification.target.entity)

    const expander = (
        <div className="justification-expander-wrapper">
          <Button icon>more_horiz</Button>
        </div>
    )

    return (
        <Card style={{fontSize: '1rem', lineHeight: '1.8rem'}}
              {...rest}
        >
          <CardTitle
              avatar={<FontIcon role="presentation">merge_type</FontIcon>}
              title={
                <Link to={paths.justification(justification)}>
                  {justification.rootStatement.text}
                </Link>
              }
              subtitle={
                <span className="recent-statement-status-text">
                  created <span title={created}>{age}</span>
                </span>
              }
          />
          {_isCounter && !_doesCounterRootJustification && expander}
          <CardText>
            {_isCounter &&
                <JustificationChatBubble id={`target-justification-${justification.target.entity.id}`}
                                         justification={justification.target.entity}
                                         doShowBasisJustifications={doShowBasisJustifications}
                                         doShowControls={false}
                />
            }
            <JustificationChatBubble justification={justification}
                                     doShowBasisJustifications={doShowBasisJustifications}
                                     doShowControls={false}
            />
          </CardText>
        </Card>
    )
  }
}