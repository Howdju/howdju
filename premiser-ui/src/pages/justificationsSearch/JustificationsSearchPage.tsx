import React, { MouseEvent, useEffect } from "react";
import FlipMove from "react-flip-move";
import { Button, CircularProgress } from "react-md";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { denormalize } from "normalizr";

import { api } from "../../actions";
import JustificationCard from "../../JustificationCard";
import { justificationsSchema } from "../../normalizationSchemas";
import config from "../../config";
import { makeExtensionHighlightOnClickWritQuoteUrlCallback } from "../../extensionCallbacks";
import { useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { extractFilters, extractIncludeUrls } from "./queryStringExtraction";

const fetchCount = 20;

export default function JustificationsSearchPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  useEffect(() => {
    const filters = extractFilters(location.search);
    const includeUrls = extractIncludeUrls(location.search);
    dispatch(
      api.fetchJustificationsSearch({ filters, includeUrls, count: fetchCount })
    );
  }, [location, dispatch]);

  const onClickWritQuoteUrl =
    makeExtensionHighlightOnClickWritQuoteUrlCallback(dispatch);

  const pageState = useAppSelector((state) => state.justificationsSearchPage);
  const entities = useAppSelector((state) => state.entities);
  const { isFetching, continuationToken } = pageState;
  const justifications = denormalize(
    pageState.justifications,
    justificationsSchema,
    entities
  );

  const fetchMore = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const filters = extractFilters(location.search);
    const includeUrls = extractIncludeUrls(location.search);
    dispatch(
      api.fetchJustificationsSearch({
        filters,
        includeUrls,
        count: fetchCount,
        continuationToken,
      })
    );
  };

  const hasJustifications = justifications && justifications.length > 0;

  const fetchMoreButton = (
    <Button
      flat
      key="fetch-more-button"
      children="Fetch more"
      disabled={isFetching}
      onClick={fetchMore}
    />
  );

  const filters = extractFilters(location.search);
  const filtersList = isEmpty(filters) ? null : (
    <ul className="md-cell md-cell--12">
      {map(filters, (val, key) => (
        <li key={key}>
          <strong>{key}</strong>: {val}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="md-grid">
      <h1 className="md-cell md-cell--12">Justifications</h1>

      {filtersList && (
        <>
          <h2 className="md-cell md-cell--12">Filters</h2>
          {filtersList}
        </>
      )}

      <FlipMove
        {...config.ui.flipMove}
        className="md-cell md-cell--12 center-text"
      >
        {map(justifications, (j) => {
          const id = `justification-card-${j.id}`;
          return (
            <JustificationCard
              className="md-cell md-cell--12"
              id={id}
              key={id}
              justification={j}
              showBasisUrls={true}
              onClickWritQuoteUrl={onClickWritQuoteUrl}
            />
          );
        })}
      </FlipMove>
      {!isFetching && !hasJustifications && (
        <div className="md-cell md-cell--12 text-center">No justifications</div>
      )}
      {isFetching && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}
      <div className="md-cell md-cell--12 cell--centered-contents">
        {fetchMoreButton}
      </div>
    </div>
  );
}
