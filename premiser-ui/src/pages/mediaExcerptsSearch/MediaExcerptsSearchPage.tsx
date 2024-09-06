import React, { MouseEvent, useEffect } from "react";
import { useLocation } from "react-router";
import { isArray, mapValues, pick, map, isEmpty } from "lodash";
import queryString from "query-string";
import { GridCell } from "@react-md/utils";

import {
  MediaExcerptSearchFilter,
  MediaExcerptSearchFilterKeys,
} from "howdju-common";
import { api, mediaExcerptsSchema } from "howdju-client-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { useAppDispatch, useAppSelector, useAppEntitySelector } from "@/hooks";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import FetchMoreButton from "@/components/button/FetchMoreButton";
import { mediaExcerptCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import { FlipGrid } from "@/components/layout/FlipGrid";
import { Page } from "@/components/layout/Page";

const fetchCount = 20;

export default function MediaExcerptsSearchPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  useEffect(() => {
    const filters = extractFilters(location.search);
    dispatch(api.fetchMediaExcerpts(filters, fetchCount));
  }, [location, dispatch]);

  const pageState = useAppSelector((state) => state.mediaExcerptsSearchPage);
  const { isFetching, continuationToken } = pageState;
  const mediaExcerpts = useAppEntitySelector(
    pageState.mediaExcerpts,
    mediaExcerptsSchema
  );

  const fetchMore = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const filters = extractFilters(location.search);
    dispatch(api.fetchMediaExcerpts(filters, fetchCount, continuationToken));
  };

  const fetchMoreButton = (
    <FetchMoreButton
      key="fetch-more-button"
      isFetching={isFetching}
      onClick={fetchMore}
    />
  );

  const hasMediaExcerpts = mediaExcerpts.length > 0;

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
      <h1>MediaExcerpts</h1>

      {filtersList && (
        <>
          <h2>Filters</h2>
          {filtersList}
        </>
      )}

      <FlipGrid>
        {map(mediaExcerpts, (me) => {
          const id = `mediaExcerpt-card-${me.id}`;
          return (
            <GridCell {...mediaExcerptCardColSpans}>
              <MediaExcerptCard id={id} mediaExcerpt={me} key={id} />
            </GridCell>
          );
        })}
      </FlipGrid>
      {!isFetching && !hasMediaExcerpts && <div>No media excerpts</div>}
      {isFetching && (
        <div>
          <CircularProgress id={`$mediaExcerptsSearchPage-Progress`} />
        </div>
      )}
      <div>{fetchMoreButton}</div>
    </Page>
  );
}

function extractFilters(locationSearch: string): MediaExcerptSearchFilter {
  const blah = pick(
    queryString.parse(locationSearch),
    MediaExcerptSearchFilterKeys
  );
  return mapValues(blah, (val) =>
    isArray(val) ? val[0] : val === null ? undefined : val
  );
}
