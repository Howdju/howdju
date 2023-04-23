import React, { HTMLAttributes } from "react";

import { WritOut } from "howdju-common";

import ListEntitiesWidget from "./ListEntitiesWidget";
import WritCard from "./WritCard";
import { smallCellClasses } from "./CellList";
import t from "./texts";
import { api } from "./actions";
import { writsSchema } from "./normalizationSchemas";
import { ComponentId } from "./types";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
}

export default function RecentWritsWidget({ id, widgetId, ...rest }: Props) {
  const writToCard = (writ: WritOut) => {
    const cardId = `${id}-writ-${writ.id}`;
    return (
      <WritCard
        id={cardId}
        key={cardId}
        writ={writ}
        className={smallCellClasses}
      />
    );
  };

  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      entitiesWidgetStateKey="recentWrits"
      fetchEntities={api.fetchRecentWrits}
      entityToCard={writToCard}
      entitiesSchema={writsSchema}
      emptyEntitiesMessage={t("No recent writs")}
      loadErrorMessage={t("There was an error fetching the recent writs.")}
    />
  );
}
