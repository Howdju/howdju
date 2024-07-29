import React, { MouseEvent, useEffect } from "react";
import { useLocation } from "react-router";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { denormalize } from "normalizr";
import { GridCell } from "@react-md/utils";

import { JustificationView } from "howdju-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { api } from "../../actions";
import JustificationCard from "../../JustificationCard";
import { justificationsSchema } from "../../normalizationSchemas";
import { makeExtensionHighlightOnClickWritQuoteUrlCallback } from "../../extensionCallbacks";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { extractFilters, extractIncludeUrls } from "./queryStringExtraction";
import FetchMoreButton from "@/components/button/FetchMoreButton";
import { largeCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import { FlipGrid } from "@/components/layout/FlipGrid";
import { Page } from "@/components/layout/Page";

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
  const justifications: JustificationView[] = denormalize(
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
    <FetchMoreButton
      key="fetch-more-button"
      isFetching={isFetching}
      onClick={fetchMore}
    />
  );

  const filters = extractFilters(location.search);
  const filtersList = isEmpty(filters) ? null : (
    <ul>
      {map(filters, (val, key) => (
        <li key={key}>
          <strong>{key}</strong>: {val}
        </li>
      ))}
    </ul>
  );

  return (
    <Page>
      <h1>Justifications</h1>

      {filtersList && (
        <>
          <h2>Filters</h2>
          {filtersList}
        </>
      )}

      <FlipGrid>
        {map(justifications, (j) => {
          const id = `justification-card-${j.id}`;
          return (
            <GridCell key={id} {...largeCardColSpans}>
              <JustificationCard
                id={id}
                justification={j}
                showBasisUrls={true}
                onClickWritQuoteUrl={onClickWritQuoteUrl}
              />
            </GridCell>
          );
        })}
      </FlipGrid>
      {!isFetching && !hasJustifications && <div>No justifications</div>}
      {isFetching && (
        <CircularProgress id={`$justificationsSearchPage-Progress`} />
      )}
      {fetchMoreButton}
    </Page>
  );
}
