import React, { useEffect } from "react";
import { CircularProgress, ListItem, MenuButton } from "react-md";
import { RouteComponentProps } from "react-router";
import { DropdownMenu } from "react-md";
import { MaterialSymbol } from "react-material-symbols";
import { Link } from "react-router-dom";

import { EntityId } from "howdju-common";

import { api } from "@/apiActions";
import { useAppDispatch, useAppEntitySelector } from "@/hooks";
import { appearanceSchema } from "@/normalizationSchemas";
import AppearanceCard from "./AppearanceCard";
import HowdjuHelmet from "@/Helmet";
import paths from "@/paths";

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
  const title = `Appearance ${appearanceId}`;

  // TODO(17): pass props directly after upgrading react-md to a version with correct types
  const menuClassNameProps = { menuClassName: "context-menu" } as any;
  const menu = appearance ? (
    <MenuButton
      icon
      id="appearance-page-menu"
      {...menuClassNameProps}
      children={"more_vert"}
      position={DropdownMenu.Positions.TOP_RIGHT}
      menuItems={[
        <ListItem
          primaryText="User&rsquo;s fact-check"
          key="user-fact-check"
          title="See all this user&rsquo;s appearances in the same Source and URL."
          leftIcon={<MaterialSymbol icon="how_to_reg" />}
          component={Link}
          to={paths.factCheck(
            [appearance.creator.id],
            appearance.mediaExcerpt.citations.map((c) => c.source.id),
            appearance.mediaExcerpt.locators.urlLocators.map((l) => l.url.id)
          )}
        />,
        appearance.confirmationStatus === "CONFIRMED" ? (
          <ListItem
            primaryText="Unconfirm this appearance"
            key="unconfirm-appearance"
            title="Remove your confirmation that the entity appears at this media excerpt."
            leftIcon={<MaterialSymbol icon="unpublished" />}
            onClick={() => dispatch(api.unconfirmAppearance(appearanceId))}
          />
        ) : (
          <ListItem
            primaryText="Confirm this appearance"
            key="confirm-appearance"
            title="Confirm that the entity appears at this media excerpt."
            leftIcon={<MaterialSymbol icon="check_circle" />}
            onClick={() => dispatch(api.confirmAppearance(appearanceId))}
          />
        ),
        appearance.confirmationStatus === "DISCONFIRMED" ? (
          <ListItem
            primaryText="Undisconfirm this appearance"
            key="undisconfirm-appearance"
            title="Remove your assertion that the entity does NOT appear at this media excerpt."
            leftIcon={<MaterialSymbol icon="do_not_disturb_off" />}
            onClick={() => dispatch(api.undisconfirmAppearance(appearanceId))}
          />
        ) : (
          <ListItem
            primaryText="Disconfirm this appearance"
            key="disconfirm-appearance"
            title="Assert that the entity does NOT appear at this media excerpt."
            leftIcon={<MaterialSymbol icon="do_not_disturb_on" />}
            onClick={() => dispatch(api.disconfirmAppearance(appearanceId))}
          />
        ),
      ]}
    />
  ) : undefined;

  return (
    <div className="md-grid">
      <HowdjuHelmet>
        <title>{title} — Howdju</title>
      </HowdjuHelmet>
      <h1 className="md-cell md-cell--12">{title}</h1>
      {appearance ? (
        <AppearanceCard
          id="appearance-page--appearance-card"
          appearance={appearance}
          menu={menu}
        />
      ) : (
        <CircularProgress id="appearance-page--progress" />
      )}
    </div>
  );
}
