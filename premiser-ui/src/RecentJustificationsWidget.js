import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import JustificationCard from './JustificationCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {justificationsSchema} from "./schemas";

export default class RecentJustificationsWidget extends Component {

  justificationToCard = j => {
    const id = this.props.id
    const cardId = `${id}-recent-justification-${j.id}`
    return <JustificationCard key={cardId}
                              justification={j}
                              doShowBasisJustifications={false}
                              className="md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone" />
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

