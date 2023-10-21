import React, { MouseEvent, ReactElement, useEffect } from "react";
import { ActionCreator } from "@reduxjs/toolkit";
import { schema } from "normalizr";
import { Grid, GridCell } from "@react-md/utils";

import { useAppDispatch, useAppSelector } from "../../hooks";
import FetchMoreButton from "../button/FetchMoreButton";
import FetchButton from "../button/FetchButton";
import { denormalizedEntity } from "@/selectors";

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
export const smallCardColSpans: GridCellProps = {
  phone: { colSpan: 4 },
  tablet: { colSpan: 4 },
  desktop: { colSpan: 3 },
  largeDesktop: { colSpan: 3 },
};

export const persorgCardColSpans = smallCardColSpans;
export const sourceCardColSpans = smallCardColSpans;
export const propositionCardColSpans = smallCardColSpans;
export const appearanceCardColSpans = largeCardColSpans;
export const justificationCardColSpans = largeCardColSpans;
export const mediaExcerptCardColSpans = largeCardColSpans;

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
    <Grid id={id} {...rest}>
      {entities?.map((e) => {
        const card = entityToCard(e);
        return (
          <GridCell clone={true} key={card.key} {...cardColSpans}>
            {card}
          </GridCell>
        );
      })}
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
    </Grid>
  );
}
