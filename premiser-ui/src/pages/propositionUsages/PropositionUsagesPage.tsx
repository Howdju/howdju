import React, { UIEvent, useEffect } from "react";
import { Button, CircularProgress } from "react-md";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { denormalize } from "normalizr";

import { api } from "../../actions";
import CellList from "../../CellList";
import {
  justificationsSchema,
  statementsSchema,
} from "../../normalizationSchemas";
import StatementCard from "../../StatementCard";
import { combineIds } from "../../viewModels";
import FlipMove from "react-flip-move";
import JustificationCard from "../../JustificationCard";
import config from "../../config";
import { useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { getQueryParam } from "@/util";
import ErrorPage from "@/ErrorPage";

const pageId = "proposition-usages-page";
const fetchCount = 20;

export default function PropositionUsagesPage() {
  const location = useLocation();
  const propositionId = getQueryParam(location, "propositionId");
  if (!propositionId) {
    return <ErrorPage message={"Invalid URL (propositionId is required.)"} />;
  }
  return ValidPropositionUsagesPage({ propositionId });
}

interface ValidProps {
  propositionId: string;
}

function ValidPropositionUsagesPage({ propositionId }: ValidProps) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // TODO: add fetchInternalPropositionAppearances/fetchExternalPropositionAppearances
    dispatch(api.fetchSentenceStatements("PROPOSITION", propositionId));
    dispatch(api.fetchIndirectPropositionStatements(propositionId));
    dispatch(
      api.fetchJustificationsSearch({
        filters: { propositionId },
        count: fetchCount,
      })
    );
  }, [dispatch, propositionId]);

  const pageState = useAppSelector((state) => state.propositionUsagesPage);
  const {
    isFetchingDirect,
    isFetchingIndirect,
    isFetchingJustifications,
    continuationToken,
  } = pageState;
  const entities = useAppSelector((state) => state.entities);
  const directStatements = denormalize(
    pageState.directStatements,
    statementsSchema,
    entities
  );
  const indirectStatements = denormalize(
    pageState.indirectStatements,
    statementsSchema,
    entities
  );
  const justifications = denormalize(
    pageState.justifications,
    justificationsSchema,
    entities
  );

  const fetchMoreJustifications = (event: UIEvent) => {
    event.preventDefault();
    dispatch(
      api.fetchJustificationsSearch({
        filters: { propositionId },
        count: fetchCount,
        continuationToken,
      })
    );
  };

  const hasDirectStatements = directStatements && directStatements.length > 0;
  const hasIndirectStatements =
    indirectStatements && indirectStatements.length > 0;
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
      <h1 className="md-cell md-cell--12">Direct Statements</h1>
      <CellList className="md-cell md-cell--12 center-text">
        {map(directStatements, (s) => {
          const id = combineIds(pageId, "statement", s.id);
          return (
            <StatementCard
              className="md-cell md-cell--12"
              id={id}
              key={id}
              statement={s}
            />
          );
        })}
      </CellList>
      {!isFetchingDirect && !hasDirectStatements && (
        <div className="md-cell md-cell--12 text-center">
          No direct statements
        </div>
      )}
      {isFetchingDirect && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}

      <h1 className="md-cell md-cell--12">Indirect Statements</h1>
      <CellList className="md-cell md-cell--12 center-text">
        {map(indirectStatements, (s) => {
          const id = combineIds(pageId, "statement", s.id);
          return (
            <StatementCard
              className="md-cell md-cell--12"
              id={id}
              key={id}
              statement={s}
            />
          );
        })}
      </CellList>
      {!isFetchingIndirect && !hasIndirectStatements && (
        <div className="md-cell md-cell--12 text-center">
          No indirect statements
        </div>
      )}
      {isFetchingIndirect && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}

      <h1 className="md-cell md-cell--12">Justifications</h1>
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
            />
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
