import React, { UIEvent, useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import FlipMove from "react-flip-move";

import { EntityId } from "howdju-common";

import {
  appearancesSchema,
  justificationsSchema,
} from "../../normalizationSchemas";
import JustificationCard from "../../JustificationCard";
import config from "../../config";
import { useAppDispatch, useAppSelector, useAppEntitySelector } from "@/hooks";
import FlipMoveWrapper from "@/FlipMoveWrapper";
import AppearanceCard from "../appearances/AppearanceCard";
import page from "./mediaExcerptUsagesSlice";
import FetchMoreButton from "@/components/button/FetchMoreButton";

interface Props {
  mediaExcerptId: EntityId;
}

export default function MediaExcerptUsages({ mediaExcerptId }: Props) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(page.fetchJustifications({ mediaExcerptId }));
    dispatch(page.fetchAppearances({ mediaExcerptId }));
  }, [dispatch, mediaExcerptId]);

  const pageState = useAppSelector((state) => state.mediaExcerptUsages);
  const {
    isFetchingJustifications,
    justificationIds,
    justificationsContinuationToken,
    isFetchingAppearances,
    appearanceIds,
    appearancesContinuationToken,
  } = pageState;

  const justifications = useAppEntitySelector(
    justificationIds,
    justificationsSchema
  );
  const appearances = useAppEntitySelector(appearanceIds, appearancesSchema);

  const fetchMoreJustifications = (event: UIEvent) => {
    event.preventDefault();
    dispatch(
      page.fetchJustifications({
        mediaExcerptId,
        continuationToken: justificationsContinuationToken,
      })
    );
  };
  const fetchMoreAppearances = (event: UIEvent) => {
    event.preventDefault();
    dispatch(
      page.fetchAppearances({
        mediaExcerptId,
        continuationToken: appearancesContinuationToken,
      })
    );
  };

  const hasJustifications = !isEmpty(justifications);
  const hasAppearances = !isEmpty(appearances);

  const fetchMoreJustificationsButton = (
    <FetchMoreButton
      key="fetch-more-justifications-button"
      isFetching={isFetchingJustifications}
      onClick={fetchMoreJustifications}
    />
  );

  return (
    <div className="md-grid">
      <h1 className="md-cell md-cell--12">Justifications</h1>
      <FlipMove
        {...config.ui.flipMove}
        className="md-cell md-cell--12 center-text"
      >
        {map(justifications, (j) => {
          const id = `justification-card-${j.id}`;
          return (
            <FlipMoveWrapper key={id}>
              <JustificationCard
                className="md-cell md-cell--6"
                id={id}
                justification={j}
              />
            </FlipMoveWrapper>
          );
        })}
      </FlipMove>
      {!isFetchingJustifications && !hasJustifications && (
        <div className="md-cell md-cell--12 text-center">No justifications</div>
      )}
      <div className="md-cell md-cell--12 cell--centered-contents">
        {fetchMoreJustificationsButton}
      </div>

      <h1 className="md-cell md-cell--12">Appearances</h1>
      <FlipMove
        {...config.ui.flipMove}
        className="md-cell md-cell--12 center-text"
      >
        {map(appearances, (a) => {
          const id = `appearance-card-${a.id}`;
          return (
            <FlipMoveWrapper key={id}>
              <AppearanceCard
                className="md-cell md-cell--6"
                id={id}
                appearance={a}
              />
            </FlipMoveWrapper>
          );
        })}
      </FlipMove>
      {!isFetchingAppearances && !hasAppearances && (
        <div className="md-cell md-cell--12 text-center">No appearances</div>
      )}
      <div className="md-cell md-cell--12 cell--centered-contents">
        <FetchMoreButton
          key="fetch-more-appearances-button"
          isFetching={isFetchingAppearances}
          onClick={fetchMoreAppearances}
        />
      </div>
    </div>
  );
}
