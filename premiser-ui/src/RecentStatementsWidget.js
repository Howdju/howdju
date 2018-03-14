import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import StatementCard from './StatementCard'
import t from './texts'
import {
  api,
  ui,
} from './actions'
import {statementsSchema} from "./schemas"

export default class RecentStatementsWidget extends Component {

  statementToCard = statement => {
    const id = this.props.id
    const cardId = `${id}-statement-${statement.id}`
    return (
      <StatementCard
        id={cardId}
        key={cardId}
        statement={statement}
        className={ListEntitiesWidget.smallCellClasses}
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
        entitiesWidgetStateKey="recentStatements"
        fetchEntities={api.fetchRecentStatements}
        entityToCard={this.statementToCard}
        entitiesSchema={statementsSchema}
        emptyEntitiesMessage={t("No recent statements")}
        loadErrorMessage={t("There was an error fetching the recent statements.")}
      />
    )
  }
}
