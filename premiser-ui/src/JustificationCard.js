import React, {Component} from "react";
import { Link } from 'react-router-dom'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'

import JustificationBasisViewer from './JustificationBasisViewer'
import paths from './paths'
import {isPositive, JustificationTargetType} from "./models";

export default class JustificationCard extends Component {
  render() {
    const {
      justification
    } = this.props
    let description
    const action = isPositive(justification) ? 'supports' : 'opposes'
    if (justification.target.type === JustificationTargetType.STATEMENT && justification.target.entity.id === justification.rootStatement.id) {
      description = `${action} the statement:`
    } else {
      description = `${action} a justification relating to the statement:`
    }
    return (
        <Card className="md-cell md-cell--3"
              style={{fontSize: '1rem', lineHeight: '1.8rem'}}
        >
          <CardText>
            <span style={{fontStyle: 'italic'}}>
              The basis:
            </span>
            <JustificationBasisViewer justification={justification} />
            <span style={{fontStyle: 'italic'}}>
              {description}
            </span>
          </CardText>
          <CardText>
            <Link to={paths.statement({id: justification.rootStatement.id})}
                  style={{textDecoration: 'none'}}
            >
              {justification.rootStatement && justification.rootStatement.text}
            </Link>
          </CardText>
        </Card>
    )
  }
}