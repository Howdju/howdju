import React, { MouseEvent, ReactElement, useEffect } from "react";
import { ActionCreator } from "@reduxjs/toolkit";
import { schema } from "normalizr";
import { GridCell } from "@react-md/utils";

import { useAppDispatch, useAppSelector } from "@/hooks";
import FetchMoreButton from "../button/FetchMoreButton";
import FetchButton from "../button/FetchButton";
import { denormalizedEntity } from "@/selectors";
import { FlipGrid } from "@/components/layout/FlipGrid";
import { CircularProgress } from "../progress/CircularProgress";

/** Corresponds to GridCSSProperties */
export interface FormFactorGridCellProps {
  colSpan: number;
}
/** Corresponds to GridCellProps. */
export interface GridCellProps {
  phone: FormFactorGridCellProps;
  tablet: FormFactorGridCellProps;
  desktop: FormFactorGridCellProps;
  largeDesktop: FormFactorGridCellProps;
}

export const largeCardColSpans: GridCellProps = {
  phone: { colSpan: 4 },
  tablet: { colSpan: 8 },
  desktop: { colSpan: 6 },
  largeDesktop: { colSpan: 6 },
};
export const mediumCardColSpans: GridCellProps = {
  phone: { colSpan: 4 },
  tablet: { colSpan: 4 },
  desktop: { colSpan: 3 },
  largeDesktop: { colSpan: 3 },
};
export const smallCardColSpans: GridCellProps = {
  phone: { colSpan: 2 },
  tablet: { colSpan: 4 },
  desktop: { colSpan: 3 },
  largeDesktop: { colSpan: 2 },
};

export const persorgCardColSpans = mediumCardColSpans;
export const sourceCardColSpans = mediumCardColSpans;
export const propositionCardColSpans = mediumCardColSpans;
export const appearanceCardColSpans = largeCardColSpans;
export const justificationCardColSpans = largeCardColSpans;
export const mediaExcerptCardColSpans = largeCardColSpans;
export const statementCardColSpans = largeCardColSpans;

type ListEntitiesWidgetProps = {
  id: string;
  widgetId: string;
  entitiesWidgetStateKey: string;
  fetchEntities: ActionCreator<any>;
  initialFetchCount?: number;
  fetchCount?: number;
  entityToCard: (entity: any) => ReactElement;
  entitiesSchema: schema.Array<any>;
  emptyEntitiesMessage: string;
  loadErrorMessage: string;
  cardColSpans: GridCellProps;
};

/**
 * A widget for a grid of entities. It handles fetching, storing, and paginating
 * the entities.
 *
 * Use ItemGrid if you have a static list of items to show.
 */
export default function ListEntitiesWidget({
  widgetId,
  fetchEntities,
  // This way the fetchMoreButton takes up the last column
  initialFetchCount = 7,
  fetchCount = 8,
  cardColSpans,
  id,
  emptyEntitiesMessage,
  loadErrorMessage,
  entitiesWidgetStateKey,
  entityToCard,
  entitiesSchema,
  ...rest
}: ListEntitiesWidgetProps) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchEntities(widgetId, initialFetchCount));
  }, [dispatch, fetchEntities, widgetId, initialFetchCount]);

  const widgetState =
    useAppSelector((state) => state.widgets.listEntities[widgetId]) || {};
  const { continuationToken, isFetching, didError } = widgetState;
  const entities = useAppSelector((state) => {
    const listEntitiesState = state.widgets.listEntities[widgetId] as
      | Record<string, any>
      | undefined;
    return denormalizedEntity(
      state,
      listEntitiesState?.[entitiesWidgetStateKey],
      entitiesSchema
    );
  }) as any[] | undefined;

  const fetchMore = (event: MouseEvent) => {
    event.preventDefault();
    const fetchMoreCount = entities?.length ? fetchCount : initialFetchCount;
    dispatch(fetchEntities(widgetId, fetchMoreCount, continuationToken));
  };

  const hasEntities = !!entities?.length;
  const fetchMoreButtonCell = (
    <FetchMoreButton
      id={`${id}-fetch-more-button`}
      onClick={fetchMore}
      disabled={isFetching}
      isFetching={isFetching}
    />
  );
  const retryButtonCell = (
    <FetchButton
      id={`${id}-retry-button`}
      disabled={isFetching}
      isFetching={isFetching}
      onClick={fetchMore}
    >
      Retry
    </FetchButton>
  );
  return (
    <FlipGrid id={id} {...rest}>
      {entities?.map((e) => {
        const card = entityToCard(e);
        return (
          <GridCell key={card.key} {...cardColSpans}>
            {card}
          </GridCell>
        );
      })}
      {!hasEntities && isFetching && (
        <GridCell key="progress">
          <CircularProgress id={`${id}-progress`} />
        </GridCell>
      )}
      {hasEntities && (
        <GridCell key="fetch-more-button" {...cardColSpans}>
          {fetchMoreButtonCell}
        </GridCell>
      )}
      {!hasEntities && !isFetching && (
        <GridCell key="empty-entities-placeholder" {...cardColSpans}>
          {emptyEntitiesMessage}
        </GridCell>
      )}
      {didError && (
        <GridCell key="error-message" className="error-message">
          {loadErrorMessage}
        </GridCell>
      )}
      {didError && !hasEntities && (
        <GridCell key="retry-button" {...cardColSpans}>
          {retryButtonCell}
        </GridCell>
      )}
    </FlipGrid>
  );
}
