import React, {Component} from 'react'

import ListEntitiesWidget from './ListEntitiesWidget'
import ExpandableChildContainer from './ExpandableChildContainer'
import WritingQuoteCard from './WritingQuoteCard'
import {default as t} from './texts'
import {
  api,
  ui,
} from './actions'
import {writingQuotesSchema} from "./schemas"

export default class RecentWritingQuotesWidget extends Component {

  writingQuoteToCard = writingQuote => {
    const id = this.props.id
    const cardId = `${id}-writing-reference-${writingQuote.id}`
    return (
      <ExpandableChildContainer ExpandableChildComponent={WritingQuoteCard}
                                widgetId={cardId}
                                key={cardId}
                                writingQuote={writingQuote}
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
                          entitiesWidgetStateKey="recentWritingQuotes"
                          clearEntities={ui.clearRecentWritingQuotes}
                          fetchEntities={api.fetchRecentWritingQuotes}
                          entityToCard={this.writingQuoteToCard}
                          entitiesSchema={writingQuotesSchema}
                          emptyEntitiesMessage={t("No recent quotes")}
                          loadErrorMessage={t("There was an error fetching the recent quotes.")}
      />
    )
  }
}
