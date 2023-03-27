import React, { HTMLAttributes } from "react";

import ListEntitiesWidget from "./ListEntitiesWidget";
import { largeCellClasses } from "./CellList";
import JustificationCard from "./JustificationCard";
import t from "./texts";
import { api } from "./actions";
import { justificationsSchema } from "./normalizationSchemas";
import { JustificationOut } from "howdju-common";
import { ComponentId } from "./types";
import FlipMoveWrapper from "./FlipMoveWrapper";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
}

export default function RecentJustificationsWidget({
  id,
  widgetId,
  ...rest
}: Props) {
  const justificationToCard = (justification: JustificationOut) => {
    const cardId = `${id}-justification-${justification.id}`;
    return (
      <FlipMoveWrapper key={cardId}>
        <JustificationCard
          id={cardId}
          justification={justification}
          doShowControls={false}
          className={largeCellClasses}
        />
      </FlipMoveWrapper>
    );
  };

  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      cellClasses={largeCellClasses}
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
