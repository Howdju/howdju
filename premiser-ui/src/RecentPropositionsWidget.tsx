import React, { HTMLAttributes } from "react";

import { PropositionOut } from "howdju-common";

import { smallCellClasses } from "./CellList";
import ListEntitiesWidget from "./components/listEntities/ListEntitiesWidget";
import PropositionCard from "./PropositionCard";
import t from "./texts";
import { api } from "./actions";
import { propositionsSchema } from "./normalizationSchemas";
import { ComponentId } from "./types";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
  initialFetchCount?: number;
  fetchCount?: number;
}

export default function RecentPropositionsWidget({
  id,
  widgetId,
  initialFetchCount,
  fetchCount,
  ...rest
}: Props) {
  const propositionToCard = (proposition: PropositionOut) => {
    const cardId = `${id}-proposition-${proposition.id}`;
    return (
      <PropositionCard
        id={cardId}
        key={cardId}
        proposition={proposition}
        className={smallCellClasses}
      />
    );
  };

  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      entitiesWidgetStateKey="recentPropositions"
      fetchEntities={api.fetchRecentPropositions}
      entityToCard={propositionToCard}
      entitiesSchema={propositionsSchema}
      emptyEntitiesMessage={t("No recent propositions")}
      loadErrorMessage={t(
        "There was an error fetching the recent propositions."
      )}
      initialFetchCount={initialFetchCount}
      fetchCount={fetchCount}
    />
  );
}
