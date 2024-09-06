import React, { HTMLAttributes } from "react";

import { PropositionOut } from "howdju-common";
import { api, propositionsSchema } from "howdju-client-common";

import ListEntitiesWidget, {
  propositionCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";
import PropositionCard from "@/PropositionCard";
import t from "@/texts";
import { ComponentId } from "@/types";

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
  function propositionToCard(proposition: PropositionOut) {
    const cardId = `${id}-proposition-${proposition.id}`;
    return (
      <PropositionCard id={cardId} key={cardId} proposition={proposition} />
    );
  }
  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      cardColSpans={propositionCardColSpans}
      entitiesWidgetStateKey="recentPropositions"
      fetchEntities={api.fetchRecentPropositions}
      entitiesSchema={propositionsSchema}
      entityToCard={propositionToCard}
      emptyEntitiesMessage={t("No recent propositions")}
      loadErrorMessage={t(
        "There was an error fetching the recent propositions."
      )}
      initialFetchCount={initialFetchCount}
      fetchCount={fetchCount}
    />
  );
}
