import React from 'react'
import map from 'lodash/map'
import take from 'lodash/take'

import {
  JustificationTargetTypes,
  newExhaustedEnumError,
} from 'howdju-common'

import * as characters from './characters'
import PropositionCard from './PropositionCard'
import StatementCard from './StatementCard'
import JustificationCard from './JustificationCard'
import TreePolarity from './components/TreePolarity'

import './ContextTrail.scss'

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
            <TreePolarity polarity={trailItem.polarity}>
              {trailItem && trailItem.target ?
                this.toCard(trailItem, take(trailItems, index)) :
                characters.ellipsis
              }
            </TreePolarity>
          </li>
        ))}
      </ul>
    )
  }

  toCard = (trailItem, trailItems) => {
    switch (trailItem.targetType) {
      case JustificationTargetTypes.PROPOSITION:
        return this.propositionToCard(trailItem.target, trailItems)
      case JustificationTargetTypes.STATEMENT:
        return this.statementToCard(trailItem.target, trailItems)
      case JustificationTargetTypes.JUSTIFICATION:
        return this.justificationToCard(trailItem.target, trailItems)
      default:
        throw newExhaustedEnumError(trailItem.targetType)
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
        showStatusText={false}
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
        showStatusText={false}
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
        showStatusText={false}
      />
    )
  }
}
