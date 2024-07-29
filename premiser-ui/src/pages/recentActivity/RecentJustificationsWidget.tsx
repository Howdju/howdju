import React, { HTMLAttributes } from "react";

import { JustificationView } from "howdju-common";

import { api } from "@/actions";
import ListEntitiesWidget, {
  justificationCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";
import JustificationCard from "@/JustificationCard";
import { justificationsSchema } from "@/normalizationSchemas";
import t from "@/texts";
import { ComponentId } from "@/types";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
}

export default function RecentJustificationsWidget({
  id,
  widgetId,
  ...rest
}: Props) {
  function justificationToCard(justification: JustificationView) {
    const cardId = `${id}-justification-${justification.id}`;
    return (
      <JustificationCard
        id={cardId}
        key={cardId}
        justification={justification}
        doShowControls={false}
      />
    );
  }
  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      cardColSpans={justificationCardColSpans}
      entitiesWidgetStateKey="recentJustifications"
      fetchEntities={api.fetchRecentJustifications}
      entityToCard={justificationToCard}
      entitiesSchema={justificationsSchema}
      emptyEntitiesMessage={t("No recent justifications")}
      loadErrorMessage={t(
        "There was an error fetching the recent justifications."
      )}
    />
  );
}
