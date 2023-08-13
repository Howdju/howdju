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
  // If the user navigates to the Appearance in the context of a MediaExcerpt, the route will have
  // a mediaExcerptId. Otherwise we must request the Appearance to get it.
  mediaExcerptId?: EntityId;
  // If the user navigates to the Appearance in the context of a Proposition, the route will have a
  // propositionId. Otherwise we must request the Appearance to get it.
  propositionId?: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

/**
 * A page displaying an Appearance.
 *
 * Users can navigate to the page from two contexts:
 *
 * - From the Appearance's MediaExcerpt, in which case we initially show other Appearances
 *   at the same MediaExcerpt.
 * - From the Appearance's Proposition, in which case we initially show other Appearances
 *   of the same Proposition.
 *
 * TODO(20): implement tabbed navigation including the justifications, other appearances of the same
 * MediaExcerpt, and other appearances of the same Proposition.
 */
export default function AppearancePage(props: Props) {
  const { appearanceId } = props.match.params;

  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(api.fetchAppearance(appearanceId));
  }, [dispatch, appearanceId]);

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
