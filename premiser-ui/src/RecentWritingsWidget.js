import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import WritingCard from './WritingCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {
  writingsSchema
} from "./schemas"

export default class RecentWritingsWidget extends Component {

  writingToCard = writing => {
    const id = this.props.id
    const cardId = `${id}-writing-${writing.id}`
    return (
      <WritingCard key={cardId}
                    writing={writing}
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
                          entitiesWidgetStateKey="recentWritings"
                          clearEntities={ui.clearRecentWritings}
                          fetchEntities={api.fetchRecentWritings}
                          entityToCard={this.writingToCard}
                          entitiesSchema={writingsSchema}
                          emptyEntitiesMessage={t("No recent writings")}
                          loadErrorMessage={t("There was an error fetching the recent writings.")}
      />
    )
  }
}
