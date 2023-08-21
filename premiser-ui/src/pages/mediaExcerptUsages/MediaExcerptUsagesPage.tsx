import React, { UIEvent, useEffect } from "react";
import { Button, CircularProgress } from "react-md";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { denormalize } from "normalizr";
import { RouteComponentProps } from "react-router";
import FlipMove from "react-flip-move";

import { AppearanceView, EntityId, JustificationView } from "howdju-common";

import { api } from "../../actions";
import {
  appearancesSchema,
  justificationsSchema,
} from "../../normalizationSchemas";
import JustificationCard from "../../JustificationCard";
import config from "../../config";
import { useAppDispatch, useAppSelector } from "@/hooks";
import ErrorPage from "@/ErrorPage";
import FlipMoveWrapper from "@/FlipMoveWrapper";
import AppearanceCard from "../appearances/AppearanceCard";
import page from "./mediaExcerptUsagesPageSlice";

const fetchCount = 20;

interface MatchParams {
  mediaExcerptId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

export default function MediaExcerptUsagesPage(props: Props) {
  const { mediaExcerptId } = props.match.params;
  if (!mediaExcerptId) {
    return (
      <ErrorPage message={"Invalid path (MediaExcerpt ID is required.)"} />
    );
  }
  return ValidMediaExcerptUsagesPage({ mediaExcerptId });
}

interface ValidProps {
  mediaExcerptId: EntityId;
}

function ValidMediaExcerptUsagesPage({ mediaExcerptId }: ValidProps) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(
      api.fetchJustificationsSearch({
        filters: { mediaExcerptId },
        count: fetchCount,
      })
    );
  }, [dispatch, mediaExcerptId]);

  const pageState = useAppSelector((state) => state.mediaExcerptUsagesPage);
  const {
    isFetchingJustifications,
    justificationIds,
    justificationsContinuationToken,
    isFetchingAppearances,
    appearanceIds,
    appearancesContinuationToken,
  } = pageState;
  const entities = useAppSelector((state) => state.entities);

  const justifications: JustificationView[] = denormalize(
    justificationIds,
    justificationsSchema,
    entities
  );
  const appearances: AppearanceView[] = denormalize(
    appearanceIds,
    appearancesSchema,
    entities
  );

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
    <Button
      flat
      key="fetch-more-justifications-button"
      children="Fetch more"
      disabled={isFetchingJustifications}
      onClick={fetchMoreJustifications}
    />
  );
  const fetchMoreAppearancesButton = (
    <Button
      flat
      key="fetch-more-appearances-button"
      children="Fetch more"
      disabled={isFetchingAppearances}
      onClick={fetchMoreAppearances}
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
                className="md-cell md-cell--12"
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
      {isFetchingJustifications && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress
            id={`$media-excerpt-usages-page--justifications--Progress`}
          />
        </div>
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
                className="md-cell md-cell--12"
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
      {isFetchingAppearances && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress
            id={`$media-excerpt-usages-page--appearances--progress`}
          />
        </div>
      )}
      <div className="md-cell md-cell--12 cell--centered-contents">
        {fetchMoreAppearancesButton}
      </div>
    </div>
  );
}
