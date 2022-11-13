import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import WritCard from './WritCard'
import CellList from './CellList'
import t from './texts'
import {
  api,
} from './actions'
import {
  writsSchema,
} from "./normalizationSchemas"

export default class RecentWritsWidget extends Component {

  writToCard = writ => {
    const id = this.props.id
    const cardId = `${id}-writ-${writ.id}`
    return (
      <WritCard
        id={cardId}
        key={cardId}
        writ={writ}
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
        entitiesWidgetStateKey="recentWrits"
        fetchEntities={api.fetchRecentWrits}
        entityToCard={this.writToCard}
        entitiesSchema={writsSchema}
        emptyEntitiesMessage={t("No recent writs")}
        loadErrorMessage={t("There was an error fetching the recent writs.")}
      />
    )
  }
}
