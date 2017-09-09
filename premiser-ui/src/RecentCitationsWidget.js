import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import CitationCard from './CitationCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {
  textualSourcesSchema
} from "./schemas"

export default class RecentCitationsWidget extends Component {

  citationToCard = citation => {
    const id = this.props.id
    const cardId = `${id}-citation-${citation.id}`
    return (
      <CitationCard key={cardId}
                    citation={citation}
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
                          entitiesWidgetStateKey="recentCitations"
                          clearEntities={ui.clearRecentCitations}
                          fetchEntities={api.fetchRecentCitations}
                          entityToCard={this.citationToCard}
                          entitiesSchema={textualSourcesSchema}
                          emptyEntitiesMessage={t("No recent citations")}
                          loadErrorMessage={t("There was an error fetching the recent citations.")}
      />
    )
  }
}
