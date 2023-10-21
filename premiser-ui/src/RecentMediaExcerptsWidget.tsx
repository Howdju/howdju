import React, { HTMLAttributes } from "react";

import { MediaExcerptOut } from "howdju-common";

import ListEntitiesWidget, {
  mediaExcerptCardColSpans,
} from "./components/listEntities/ListEntitiesWidget";
import { api } from "./actions";
import { mediaExcerptsSchema } from "./normalizationSchemas";
import MediaExcerptCard from "./components/mediaExcerpts/MediaExcerptCard";
import { ComponentId } from "./types";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
}

export default function RecentMediaExcerptsWidget({
  id,
  widgetId,
  ...rest
}: Props) {
  function toCard(mediaExcerpt: MediaExcerptOut) {
    const cardId = `${id}-media-excerpt-${mediaExcerpt.id}`;
    return (
      <MediaExcerptCard id={cardId} key={cardId} mediaExcerpt={mediaExcerpt} />
    );
  }
  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      cardColSpans={mediaExcerptCardColSpans}
      entitiesWidgetStateKey="recentMediaExcerpts"
      fetchEntities={api.fetchRecentMediaExcerpts}
      entityToCard={toCard}
      entitiesSchema={mediaExcerptsSchema}
      emptyEntitiesMessage="No recent media excerpts"
      loadErrorMessage="There was an error fetching the recent media excerpts."
    />
  );
}
