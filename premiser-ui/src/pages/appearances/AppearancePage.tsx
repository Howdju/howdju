import React, { useEffect } from "react";
import { CircularProgress } from "react-md";
import { RouteComponentProps } from "react-router";

import { EntityId } from "howdju-common";

import { api } from "@/apiActions";
import { useAppDispatch, useAppEntitySelector } from "@/hooks";
import { appearanceSchema } from "@/normalizationSchemas";
import AppearanceCard from "./AppearanceCard";

interface MatchParams {
  appearanceId: EntityId;
  mediaExcerptId?: EntityId;
  propositionId?: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

/**
 * A page displaying an Appearance.
 *
 * The page can occur in two contexts:
 *
 * - The Appearance's MediaExcerpt, in which case we show other Appearances
 *   at the same MediaExcerpt.
 * - The Appearance's Proposition, in which case we show other Appearances
 *   of the same Proposition.
 */
export default function AppearancePage(props: Props) {
  const { appearanceId, mediaExcerptId, propositionId } = props.match.params;

  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(api.fetchAppearance(appearanceId));
  }, [dispatch, appearanceId]);
  useEffect(() => {
    if (mediaExcerptId) {
      // TODO
      // dispatch(api.fetchPropositionsAppearingAtMediaExcerpt(mediaExcerptId));
    }
  }, [dispatch, mediaExcerptId]);
  useEffect(() => {
    if (propositionId) {
      // TODO
      // dispatch(api.fetchMediaExcerptsWherePropositionAppears(propositionId));
    }
  }, [dispatch, propositionId]);

  const appearance = useAppEntitySelector(appearanceId, appearanceSchema);

  return appearance ? (
    <AppearanceCard
      id="appearance-page--appearance-card"
      appearance={appearance}
    />
  ) : (
    <CircularProgress id="appearance-page--progress" />
  );
}
