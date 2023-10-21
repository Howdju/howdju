import React, { UIEvent, useEffect } from "react";
import { map, isEmpty } from "lodash";
import { RouteComponentProps } from "react-router";
import { Grid, GridCell } from "@react-md/utils";

import { EntityId } from "howdju-common";

import config from "@/config";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { api } from "../../actions";
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
import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import ErrorPage from "@/ErrorPage";
import AppearanceCard from "../appearances/AppearanceCard";
import PropositionCompoundCard from "@/PropositionCompoundCard";
import PropositionCard from "@/PropositionCard";
import FetchMoreButton from "@/components/button/FetchMoreButton";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import {
  appearanceCardColSpans,
  justificationCardColSpans,
  propositionCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";

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
    <FetchMoreButton
      isFetching={isFetchingJustifications}
      onClick={fetchMoreJustifications}
    />
  );

  return (
    <div>
      <h1>Proposition Usages</h1>
      {proposition && (
        <SingleColumnGrid>
          <PropositionCard
            id={combineIds(pageId, "proposition")}
            proposition={proposition}
          />
        </SingleColumnGrid>
      )}

      <h2>Direct Statements</h2>
      <Grid clone={true} columns={2}>
        {map(directStatements, (s) => {
          const id = combineIds(pageId, "statement", s.id);
          return <StatementCard id={id} key={id} statement={s} />;
        })}
      </Grid>
      {!isFetchingDirect && !hasDirectStatements && (
        <div>No direct statements</div>
      )}
      {isFetchingDirect && (
        <div>
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}

      <h2>Indirect Statements</h2>
      <Grid clone={true} columns={2}>
        {map(indirectStatements, (s) => {
          const id = combineIds(pageId, "statement", s.id);
          return <StatementCard id={id} key={id} statement={s} />;
        })}
      </Grid>
      {!isFetchingIndirect && !hasIndirectStatements && (
        <div>No indirect statements</div>
      )}
      {isFetchingIndirect && (
        <div>
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}

      <h2>Justifications</h2>
      <Grid cloneStyles={true}>
        <FlipMove {...config.ui.flipMove}>
          {map(justifications, (j) => {
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
      {isFetchingJustifications && (
        <div>
          <CircularProgress id={`$justificationsSearchPage-Progress`} />
        </div>
      )}
      <div>{fetchMoreJustificationsButton}</div>

      <h2>Appearances</h2>
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
      {!isFetchingAppearances && !hasAppearances && <div>No Appearances</div>}
      {isFetchingAppearances && (
        <div>
          <CircularProgress id={`appearances-progress`} />
        </div>
      )}

      <h2>PropositionCompounds</h2>
      <Grid cloneStyles={true}>
        <FlipMove {...config.ui.flipMove}>
          {map(propositionCompounds, (pc) => {
            const id = `proposition-compound-card-${pc.id}`;
            return (
              <GridCell key={id} {...propositionCardColSpans}>
                <PropositionCompoundCard id={id} propositionCompound={pc} />
              </GridCell>
            );
          })}
        </FlipMove>
      </Grid>
      {!isFetchingPropositionCompounds && !hasPropositionCompounds && (
        <div>No PropositionCompounds</div>
      )}
      {isFetchingPropositionCompounds && (
        <div>
          <CircularProgress id={`proposition-compounds-progress`} />
        </div>
      )}
    </div>
  );
}
