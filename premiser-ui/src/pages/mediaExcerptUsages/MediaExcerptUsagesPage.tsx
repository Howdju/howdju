import React, { UIEvent, useEffect } from "react";
import { Button, CircularProgress } from "react-md";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { denormalize } from "normalizr";
import { RouteComponentProps } from "react-router";
import FlipMove from "react-flip-move";

import { EntityId, JustificationView } from "howdju-common";

import { api } from "../../actions";
import { justificationsSchema } from "../../normalizationSchemas";
import JustificationCard from "../../JustificationCard";
import config from "../../config";
import { useAppDispatch, useAppSelector } from "@/hooks";
import ErrorPage from "@/ErrorPage";
import FlipMoveWrapper from "@/FlipMoveWrapper";

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
  const { isFetchingJustifications, justificationsContinuationToken } =
    pageState;
  const entities = useAppSelector((state) => state.entities);

  const justifications: JustificationView[] = denormalize(
    pageState.justifications,
    justificationsSchema,
    entities
  );

  const fetchMoreJustifications = (event: UIEvent) => {
    event.preventDefault();
    dispatch(
      api.fetchJustificationsSearch({
        filters: { mediaExcerptId },
        count: fetchCount,
        continuationToken: justificationsContinuationToken,
      })
    );
  };

  const hasJustifications = !isEmpty(justifications);

  const fetchMoreJustificationsButton = (
    <Button
      flat
      key="fetch-more-button"
      children="Fetch more"
      disabled={isFetchingJustifications}
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
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}
      <div className="md-cell md-cell--12 cell--centered-contents">
        {fetchMoreJustificationsButton}
      </div>
    </div>
  );
}
