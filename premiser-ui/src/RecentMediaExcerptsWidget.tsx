import React, { HTMLAttributes } from "react";

import { MediaExcerptOut } from "howdju-common";

import { largeCellClasses } from "./CellList";
import ListEntitiesWidget from "./ListEntitiesWidget";
import { api } from "./actions";
import { mediaExcerptsSchema } from "./normalizationSchemas";
import MediaExcerptCard from "./components/mediaExcerpts/MediaExcerptCard";

interface Props extends HTMLAttributes<HTMLDivElement> {
  widgetId: string;
}

export default function RecentMediaExcerptsWidget({
  id,
  widgetId,
  ...rest
}: Props) {
  const toCard = (mediaExcerpt: MediaExcerptOut) => {
    const cardId = `${id}-media-excerpt-${mediaExcerpt.id}`;
    return (
      <MediaExcerptCard
        id={cardId}
        key={cardId}
        mediaExcerpt={mediaExcerpt}
        className={largeCellClasses}
      />
    );
  };

  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      entitiesWidgetStateKey="recentMediaExcerpts"
      fetchEntities={api.fetchRecentMediaExcerpts}
      cellClasses={largeCellClasses}
      entityToCard={toCard}
      entitiesSchema={mediaExcerptsSchema}
      emptyEntitiesMessage="No recent media excerpts"
      loadErrorMessage="There was an error fetching the recent media excerpts."
    />
  );
}
