import React, { HTMLAttributes } from "react";

import { WritQuoteOut } from "howdju-common";

import { smallCellClasses } from "./CellList";
import ListEntitiesWidget from "./components/listEntities/ListEntitiesWidget";
import WritQuoteCard from "./WritQuoteCard";
import t from "./texts";
import { api } from "./actions";
import { writQuotesSchema } from "./normalizationSchemas";
import { ComponentId } from "./types";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
}

export default function RecentWritQuotesWidget({
  id,
  widgetId,
  ...rest
}: Props) {
  const writQuoteToCard = (writQuote: WritQuoteOut) => {
    const cardId = `${id}-writ-quote-${writQuote.id}`;
    return (
      <WritQuoteCard
        id={cardId}
        key={cardId}
        writQuote={writQuote}
        className={smallCellClasses}
      />
    );
  };

  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      entitiesWidgetStateKey="recentWritQuotes"
      fetchEntities={api.fetchRecentWritQuotes}
      entityToCard={writQuoteToCard}
      entitiesSchema={writQuotesSchema}
      emptyEntitiesMessage={t("No recent quotes")}
      loadErrorMessage={t("There was an error fetching the recent quotes.")}
    />
  );
}
