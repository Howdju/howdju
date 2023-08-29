import React, { MouseEvent, useEffect } from "react";
import { useLocation } from "react-router";
import FlipMove from "react-flip-move";
import { Button, CircularProgress } from "react-md";
import { isArray, mapValues, pick, map, isEmpty } from "lodash";
import queryString from "query-string";

import {
  MediaExcerptSearchFilter,
  MediaExcerptSearchFilterKeys,
} from "howdju-common";

import { api } from "../../actions";
import config from "../../config";
import { useAppDispatch, useAppSelector, useAppEntitySelector } from "@/hooks";
import FlipMoveWrapper from "@/FlipMoveWrapper";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import { mediaExcerptsSchema } from "@/normalizationSchemas";

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
    <Button
      flat
      key="fetch-more-button"
      children="Fetch more"
      disabled={isFetching}
      onClick={fetchMore}
    />
  );

  const hasMediaExcerpts = mediaExcerpts.length > 0;

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
      <h1 className="md-cell md-cell--12">MediaExcerpts</h1>

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
        {map(mediaExcerpts, (me) => {
          const id = `mediaExcerpt-card-${me.id}`;
          return (
            <FlipMoveWrapper key={id}>
              <MediaExcerptCard
                className="md-cell md-cell--12"
                id={id}
                mediaExcerpt={me}
              />
            </FlipMoveWrapper>
          );
        })}
      </FlipMove>
      {!isFetching && !hasMediaExcerpts && (
        <div className="md-cell md-cell--12 text-center">No media excerpts</div>
      )}
      {isFetching && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id={`$mediaExcerptsSearchPage-Progress`} />
        </div>
      )}
      <div className="md-cell md-cell--12 cell--centered-contents">
        {fetchMoreButton}
      </div>
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
