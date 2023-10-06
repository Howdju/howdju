import React, { MouseEvent, useEffect } from "react";
import { ActionCreator } from "@reduxjs/toolkit";
import concat from "lodash/concat";
import map from "lodash/map";
import { denormalize, Schema } from "normalizr";

import CellList, { smallCellClasses } from "../../CellList";
import { useAppDispatch, useAppSelector } from "../../hooks";
import FetchMoreButton from "../button/FetchMoreButton";
import FetchButton from "../button/FetchButton";

type ListEntitiesWidgetProps = {
  id: string;
  widgetId: string;
  entitiesWidgetStateKey: string;
  fetchEntities: ActionCreator<any>;
  initialFetchCount?: number;
  fetchCount?: number;
  entityToCard: (...args: any[]) => any;
  entitiesSchema: Schema<any>;
  emptyEntitiesMessage: string;
  loadErrorMessage: string;
  cellClasses?: string;
};

export default function ListEntitiesWidget({
  widgetId,
  fetchEntities,
  // This way the fetchMoreButton takes up the last column
  initialFetchCount = 7,
  fetchCount = 8,
  cellClasses = smallCellClasses,
  id,
  emptyEntitiesMessage,
  loadErrorMessage,
  // ignore
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
    return denormalize(
      listEntitiesState?.[entitiesWidgetStateKey],
      entitiesSchema,
      state.entities
    );
  });

  const fetchMore = (event: MouseEvent) => {
    event.preventDefault();
    const fetchMoreCount = entities?.length ? fetchCount : initialFetchCount;
    dispatch(fetchEntities(widgetId, fetchMoreCount, continuationToken));
  };

  const hasEntities = !!entities?.length;
  const cards = () => map(entities, entityToCard);
  const fetchMoreButtonCell = (
    <div className={cellClasses} key="fetch-more-button">
      <FetchMoreButton
        id={`${id}-fetch-more-button`}
        onClick={fetchMore}
        disabled={isFetching}
        isFetching={isFetching}
      />
    </div>
  );
  const retryButtonCell = (
    <div className={cellClasses} key="retry-button">
      <FetchButton
        id={`${id}-retry-button`}
        disabled={isFetching}
        isFetching={isFetching}
        onClick={fetchMore}
      >
        Retry
      </FetchButton>
    </div>
  );
  return (
    <CellList id={id} {...rest}>
      {hasEntities && concat(cards(), fetchMoreButtonCell)}
      {!hasEntities && !isFetching && (
        <div key="empty-entities-placeholder" className="md-cell md-cell--12">
          {emptyEntitiesMessage}
        </div>
      )}
      {didError && (
        <span key="error-message" className="error-message">
          {loadErrorMessage}
        </span>
      )}
      {didError && !hasEntities && retryButtonCell}
    </CellList>
  );
}
