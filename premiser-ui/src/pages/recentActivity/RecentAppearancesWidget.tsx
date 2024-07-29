import React, { HTMLAttributes } from "react";

import { AppearanceOut } from "howdju-common";

import { api } from "@/actions";
import ListEntitiesWidget, {
  appearanceCardColSpans
} from "@/components/listEntities/ListEntitiesWidget";
import { appearancesSchema } from "@/normalizationSchemas";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { ComponentId } from "@/types";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id: ComponentId;
  widgetId: string;
}

export default function RecentAppearancesWidget({
  id,
  widgetId,
  ...rest
}: Props) {
  function toCard(appearance: AppearanceOut) {
    const cardId = `${id}-appearance-${appearance.id}`;
    return <AppearanceCard id={cardId} key={cardId} appearance={appearance} />;
  }
  return (
    <ListEntitiesWidget
      {...rest}
      id={id}
      widgetId={widgetId}
      entitiesWidgetStateKey="recentAppearances"
      fetchEntities={api.fetchRecentAppearances}
      cardColSpans={appearanceCardColSpans}
      entityToCard={toCard}
      entitiesSchema={appearancesSchema}
      emptyEntitiesMessage="No recent appearances"
      loadErrorMessage="There was an error fetching the recent appearances."
    />
  );
}
