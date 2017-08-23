import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import ExpandableTextCard from './ExpandableTextCard'
import StatementCard from './StatementCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {statementsSchema} from "./schemas";

export default class RecentStatementsWidget extends Component {

  statementToCard = statement => {
    const id = this.props.id
    const cardId = `${id}-statement-${statement.id}`
    return (
      <ExpandableTextCard CardComponent={StatementCard}
                          widgetId={cardId}
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
        <ListEntitiesWidget {...rest}
                            id={id}
                            widgetId={widgetId}
                            entitiesWidgetStateKey="recentStatements"
                            clearEntities={ui.clearRecentStatements}
                            fetchEntities={api.fetchRecentStatements}
                            entityToCard={this.statementToCard}
                            entitiesSchema={statementsSchema}
                            emptyEntitiesMessage={t("No recent statements")}
                            loadErrorMessage={t("There was an error fetching the recent statements.")}
        />
    )
  }
}
