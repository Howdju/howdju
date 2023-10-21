import React, { MouseEvent, useEffect } from "react";
import { useLocation } from "react-router";
import FlipMove from "react-flip-move";
import { isArray, mapValues, pick, map, isEmpty } from "lodash";
import queryString from "query-string";
import { Grid, GridCell } from "@react-md/utils";

import {
  MediaExcerptSearchFilter,
  MediaExcerptSearchFilterKeys,
} from "howdju-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { api } from "../../actions";
import config from "../../config";
import { useAppDispatch, useAppSelector, useAppEntitySelector } from "@/hooks";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import { mediaExcerptsSchema } from "@/normalizationSchemas";
import FetchMoreButton from "@/components/button/FetchMoreButton";

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
    <div>
      <h1>MediaExcerpts</h1>

      {filtersList && (
        <>
          <h2>Filters</h2>
          {filtersList}
        </>
      )}

      <Grid cloneStyles={true}>
        <FlipMove {...config.ui.flipMove}>
          {map(mediaExcerpts, (me) => {
            const id = `mediaExcerpt-card-${me.id}`;
            return (
              <GridCell clone={true}>
                <MediaExcerptCard id={id} mediaExcerpt={me} key={id} />
              </GridCell>
            );
          })}
        </FlipMove>
      </Grid>
      {!isFetching && !hasMediaExcerpts && <div>No media excerpts</div>}
      {isFetching && (
        <div>
          <CircularProgress id={`$mediaExcerptsSearchPage-Progress`} />
        </div>
      )}
      <div>{fetchMoreButton}</div>
    </div>
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
