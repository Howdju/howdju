import React, { UIEvent, useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import FlipMove from "react-flip-move";
import { Grid, GridCell } from "@react-md/utils";

import { EntityId } from "howdju-common";

import {
  appearancesSchema,
  justificationsSchema,
} from "../../normalizationSchemas";
import JustificationCard from "../../JustificationCard";
import config from "../../config";
import { useAppDispatch, useAppSelector, useAppEntitySelector } from "@/hooks";
import AppearanceCard from "../appearances/AppearanceCard";
import page from "./mediaExcerptUsagesSlice";
import FetchMoreButton from "@/components/button/FetchMoreButton";
import {
  appearanceCardColSpans,
  justificationCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";

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
    <div>
      <h1>Justifications</h1>
      <Grid cloneStyles={true}>
        <FlipMove {...config.ui.flipMove}>
          {justifications.map((j) => {
            const id = `justification-card-${j.id}`;
            return (
              <GridCell key={id} {...justificationCardColSpans}>
                <JustificationCard id={id} justification={j} />
              </GridCell>
            );
          })}
        </FlipMove>
      </Grid>
      {!isFetchingJustifications && !hasJustifications && (
        <div>No justifications</div>
      )}
      <div>{fetchMoreJustificationsButton}</div>

      <h1>Appearances</h1>
      <Grid cloneStyles={true}>
        <FlipMove {...config.ui.flipMove}>
          {map(appearances, (a) => {
            const id = `appearance-card-${a.id}`;
            return (
              <GridCell key={id} {...appearanceCardColSpans}>
                <AppearanceCard id={id} appearance={a} />
              </GridCell>
            );
          })}
        </FlipMove>
      </Grid>
      {!isFetchingAppearances && !hasAppearances && <div>No appearances</div>}
      <div>
        <FetchMoreButton
          key="fetch-more-appearances-button"
          isFetching={isFetchingAppearances}
          onClick={fetchMoreAppearances}
        />
      </div>
    </div>
  );
}
