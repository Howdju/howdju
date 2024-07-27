import React, { UIEvent, useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import { GridCell } from "@react-md/utils";

import { EntityId } from "howdju-common";

import {
  appearancesSchema,
  justificationsSchema,
} from "../../normalizationSchemas";
import JustificationCard from "../../JustificationCard";
import { useAppDispatch, useAppSelector, useAppEntitySelector } from "@/hooks";
import ApparitionCard from "../appearances/ApparitionCard";
import page from "./mediaExcerptUsagesSlice";
import FetchMoreButton from "@/components/button/FetchMoreButton";
import {
  appearanceCardColSpans,
  justificationCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";
import { FlipGrid } from "@/components/layout/FlipGrid";

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
      <FlipGrid>
        {justifications.map((j) => {
          const id = `justification-card-${j.id}`;
          return (
            <GridCell key={id} {...justificationCardColSpans}>
              <JustificationCard id={id} justification={j} />
            </GridCell>
          );
        })}
      </FlipGrid>
      {!isFetchingJustifications && !hasJustifications && (
        <div>No justifications</div>
      )}
      <div>{fetchMoreJustificationsButton}</div>

      <h1>Appearances</h1>
      <FlipGrid>
        {appearances.map((a) => {
          const id = `appearance-card-${a.id}`;
          return (
            <GridCell key={id} {...appearanceCardColSpans}>
              <ApparitionCard id={id} appearance={a} />
            </GridCell>
          );
        })}
      </FlipGrid>
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
