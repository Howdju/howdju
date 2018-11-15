import React, {Component} from 'react'

import CellList from './CellList'
import ListEntitiesWidget from './ListEntitiesWidget'
import PropositionCard from './PropositionCard'
import t from './texts'
import {
  api,
} from './actions'
import {propositionsSchema} from "./normalizationSchemas"

export default class RecentPropositionsWidget extends Component {

  propositionToCard = proposition => {
    const id = this.props.id
    const cardId = `${id}-proposition-${proposition.id}`
    return (
      <PropositionCard
        id={cardId}
        key={cardId}
        proposition={proposition}
        className={CellList.smallCellClasses}
      />
    )
  }

  render() {
    const {
      id,
      widgetId,
      ...rest
    } = this.props
    return (
      <ListEntitiesWidget
        {...rest}
        id={id}
        widgetId={widgetId}
        entitiesWidgetStateKey="recentPropositions"
        fetchEntities={api.fetchRecentPropositions}
        entityToCard={this.propositionToCard}
        entitiesSchema={propositionsSchema}
        emptyEntitiesMessage={t("No recent propositions")}
        loadErrorMessage={t("There was an error fetching the recent propositions.")}
      />
    )
  }
}
