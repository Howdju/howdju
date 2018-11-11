import React from 'react'
import map from 'lodash/map'
import take from 'lodash/take'

import {
  JustificationTargetType,
  newExhaustedEnumError,
} from 'howdju-common'

import * as characters from './characters'
import PropositionCard from './PropositionCard'
import StatementCard from './StatementCard'
import JustificationCard from './JustificationCard'

export default class ContextTrail extends React.Component {

  render() {
    const {
      trailItems,
      ...rest
    } = this.props
    return trailItems.length > 0 && (
      <ul className="context-trail" {...rest}>
        {map(trailItems, (trailItem, index) => (
          <li key={index}>
            {trailItem ?
              this.toCard(trailItem, take(trailItems, index)) :
              characters.ellipsis
            }
          </li>
        ))}
      </ul>
    )
  }

  toCard = (trailItem, trailItems) => {
    switch (trailItem.type) {
      case (JustificationTargetType.PROPOSITION):
        return this.propositionToCard(trailItem.entity, trailItems)
      case (JustificationTargetType.STATEMENT):
        return this.statementToCard(trailItem.entity, trailItems)
      case (JustificationTargetType.JUSTIFICATION):
        return this.justificationToCard(trailItem.entity, trailItems)
      default:
        throw newExhaustedEnumError('JustificationTargetType', trailItem.type)
    }
  }

  propositionToCard = (proposition, trailItems) => {
    const id = this.props.id
    const cardId = `${id}-proposition-${proposition.id}`
    return (
      <PropositionCard
        id={cardId}
        proposition={proposition}
        contextTrailItems={trailItems}
      />
    )
  }

  statementToCard = (statement, trailItems) => {
    const id = this.props.id
    const cardId = `${id}-statement-${statement.id}`
    return (
      <StatementCard
        id={cardId}
        statement={statement}
        contextTrailItems={trailItems}
      />
    )
  }

  justificationToCard = (justification, trailItems) => {
    const id = this.props.id
    const cardId = `${id}-justification-${justification.id}`
    return (
      <JustificationCard
        id={cardId}
        justification={justification}
        doShowBasisJustifications={false}
        doShowControls={false}
        doShowTargets={false}
        contextTrailItems={trailItems}
      />
    )
  }
}