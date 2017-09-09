import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import ExpandableChildContainer from './ExpandableChildContainer'
import CitationReferenceCard from './CitationReferenceCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {textualSourceQuotesSchema} from "./schemas"

export default class RecentCitationReferencesWidget extends Component {

  citationReferenceToCard = citationReference => {
    const id = this.props.id
    const cardId = `${id}-citation-reference-${citationReference.id}`
    return (
      <ExpandableChildContainer ExpandableChildComponent={CitationReferenceCard}
                                widgetId={cardId}
                                key={cardId}
                                citationReference={citationReference}
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
                          entitiesWidgetStateKey="recentCitationReferences"
                          clearEntities={ui.clearRecentCitationReferences}
                          fetchEntities={api.fetchRecentCitationReferences}
                          entityToCard={this.citationReferenceToCard}
                          entitiesSchema={textualSourceQuotesSchema}
                          emptyEntitiesMessage={t("No recent quotes")}
                          loadErrorMessage={t("There was an error fetching the recent quotes.")}
      />
    )
  }
}
