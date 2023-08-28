import React, { UIEvent, useEffect } from "react";
import { Button, CircularProgress } from "react-md";
import { map, isEmpty } from "lodash";
import { RouteComponentProps } from "react-router";

import { EntityId } from "howdju-common";

import { api } from "../../actions";
import CellList from "../../CellList";
import {
  justificationsSchema,
  statementsSchema,
  appearancesSchema,
  propositionCompoundsSchema,
  propositionSchema,
} from "../../normalizationSchemas";
import StatementCard from "../../StatementCard";
import { combineIds } from "../../viewModels";
import FlipMove from "react-flip-move";
import JustificationCard from "../../JustificationCard";
import config from "../../config";
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import ErrorPage from "@/ErrorPage";
import FlipMoveWrapper from "@/FlipMoveWrapper";
import AppearanceCard from "../appearances/AppearanceCard";
import PropositionCompoundCard from "@/PropositionCompoundCard";
import PropositionCard from "@/PropositionCard";

const pageId = "proposition-usages-page";
const fetchCount = 20;

interface MatchParams {
  propositionId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

export default function PropositionUsagesPage(props: Props) {
  const { propositionId } = props.match.params;
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
    dispatch(api.fetchProposition(propositionId));
    dispatch(api.fetchSentenceStatements("PROPOSITION", propositionId));
    dispatch(api.fetchIndirectPropositionStatements(propositionId));
    dispatch(
      api.fetchJustificationsSearch({
        filters: { propositionId },
        count: fetchCount,
      })
    );
    dispatch(api.fetchPropositionAppearances(propositionId));
    dispatch(api.fetchPropositionCompounds(propositionId));
  }, [dispatch, propositionId]);

  const proposition = useAppEntitySelector(propositionId, propositionSchema);
  const pageState = useAppSelector((state) => state.propositionUsagesPage);
  const {
    isFetchingDirect,
    isFetchingIndirect,
    isFetchingJustifications,
    isFetchingAppearances,
    isFetchingPropositionCompounds,
    justificationsContinuationToken,
  } = pageState;
  const directStatements = useAppEntitySelector(
    pageState.directStatements,
    statementsSchema
  );
  const indirectStatements = useAppEntitySelector(
    pageState.indirectStatements,
    statementsSchema
  );
  const justifications = useAppEntitySelector(
    pageState.justifications,
    justificationsSchema
  );
  const appearances = useAppEntitySelector(
    pageState.appearanceIds,
    appearancesSchema
  );
  const propositionCompounds = useAppEntitySelector(
    pageState.propositionCompoundIds,
    propositionCompoundsSchema
  );

  const fetchMoreJustifications = (event: UIEvent) => {
    event.preventDefault();
    dispatch(
      api.fetchJustificationsSearch({
        filters: { propositionId },
        count: fetchCount,
        continuationToken: justificationsContinuationToken,
      })
    );
  };

  const hasDirectStatements = directStatements && directStatements.length > 0;
  const hasIndirectStatements =
    indirectStatements && indirectStatements.length > 0;
  const hasJustifications = !isEmpty(justifications);
  const hasAppearances = !isEmpty(appearances);
  const hasPropositionCompounds = !isEmpty(propositionCompounds);

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
      <h1 className="md-cell md-cell--12">Proposition Usages</h1>
      {proposition && (
        <PropositionCard
          id={combineIds(pageId, "proposition")}
          proposition={proposition}
        />
      )}

      <h2 className="md-cell md-cell--12">Direct Statements</h2>
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

      <h2 className="md-cell md-cell--12">Indirect Statements</h2>
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

      <h2 className="md-cell md-cell--12">Justifications</h2>
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

      <h2 className="md-cell md-cell--12">Appearances</h2>
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
        <div className="md-cell md-cell--12 text-center">No Appearances</div>
      )}
      {isFetchingAppearances && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id={`appearances-progress`} />
        </div>
      )}

      <h2 className="md-cell md-cell--12">PropositionCompounds</h2>
      <FlipMove
        {...config.ui.flipMove}
        className="md-cell md-cell--12 center-text"
      >
        {map(propositionCompounds, (pc) => {
          const id = `proposition-compound-card-${pc.id}`;
          return (
            <FlipMoveWrapper key={id}>
              <PropositionCompoundCard
                className="md-cell md-cell--12"
                id={id}
                propositionCompound={pc}
              />
            </FlipMoveWrapper>
          );
        })}
      </FlipMove>
      {!isFetchingPropositionCompounds && !hasPropositionCompounds && (
        <div className="md-cell md-cell--12 text-center">
          No PropositionCompounds
        </div>
      )}
      {isFetchingPropositionCompounds && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id={`proposition-compounds-progress`} />
        </div>
      )}
    </div>
  );
}
