import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import JustificationCard from './JustificationCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {justificationsSchema} from "./schemas"

export default class RecentJustificationsWidget extends Component {

  justificationToCard = justification => {
    const id = this.props.id
    const cardId = `${id}-justification-${justification.id}`
    return (
      <JustificationCard key={cardId}
                         justification={justification}
                         doShowBasisJustifications={false}
                         className={ListEntitiesWidget.largeCellClasses}
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
                          cellClasses={ListEntitiesWidget.largeCellClasses}
                          entitiesWidgetStateKey="recentJustifications"
                          clearEntities={ui.clearRecentJustifications}
                          fetchEntities={api.fetchRecentJustifications}
                          entityToCard={this.justificationToCard}
                          entitiesSchema={justificationsSchema}
                          emptyEntitiesMessage={t("No recent justifications")}
                          loadErrorMessage={t("There was an error fetching the recent justifications.")}
      />
    )
  }
}
