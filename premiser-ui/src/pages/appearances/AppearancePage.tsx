import React, { useContext, useEffect } from "react";
import { RouteComponentProps } from "react-router";
import { MaterialSymbol } from "react-material-symbols";
import { Link } from "react-router-dom";

import { EntityId } from "howdju-common";

import { DropdownMenu, MenuItem, MenuItemLink } from "@/components/menu/Menu";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { api } from "@/apiActions";
import { useAppDispatch, useAppEntitySelector } from "@/hooks";
import { appearanceSchema } from "@/normalizationSchemas";
import AppearanceCard from "./AppearanceCard";
import HowdjuHelmet from "@/Helmet";
import paths from "@/paths";
import FocusValidatingContextTrail from "@/components/contextTrail/FocusValidatingContextTrail";
import { PrimaryContextTrail } from "@/components/contextTrail/PrimaryContextTrailProvider";
import { FontIcon } from "@react-md/icon";
import { flows } from "@/actions";
import app from "@/app/appSlice";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { Page } from "@/components/layout/Page";

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

  const { contextTrailItems } = useContext(PrimaryContextTrail);

  const appearance = useAppEntitySelector(appearanceId, appearanceSchema);
  const title = `Appearance ${appearanceId}`;

  const menu = appearance ? (
    <DropdownMenu
      buttonType="icon"
      id="appearance-page-menu"
      menuClassName="context-menu"
      children={<FontIcon>more_vert</FontIcon>}
      items={[
        <MenuItemLink
          primaryText="User&rsquo;s fact-check"
          key="user-fact-check"
          title="See all this user&rsquo;s appearances in the same Source and URL."
          leftAddon={<MaterialSymbol icon="how_to_reg" />}
          component={Link}
          to={paths.factCheck(
            [appearance.creator.id],
            appearance.mediaExcerpt.citations.map((c) => c.source.id),
            appearance.mediaExcerpt.locators.urlLocators.map((l) => l.url.id)
          )}
        />,
        appearance.confirmationStatus === "CONFIRMED" ? (
          <MenuItem
            primaryText="Unconfirm this appearance"
            key="unconfirm-appearance"
            title="Remove your confirmation that the entity appears at this media excerpt."
            leftAddon={<MaterialSymbol icon="unpublished" />}
            onClick={() =>
              dispatch(
                flows.apiActionOnSuccess(
                  api.unconfirmAppearance(appearanceId),
                  app.addToast("Unconfirmed the appearance.")
                )
              )
            }
          />
        ) : (
          <MenuItem
            primaryText="Confirm this appearance"
            key="confirm-appearance"
            title="Confirm that the entity appears at this media excerpt."
            leftAddon={<MaterialSymbol icon="check_circle" />}
            onClick={() =>
              dispatch(
                flows.apiActionOnSuccess(
                  api.confirmAppearance(appearanceId),
                  app.addToast("Confirmed the appearance.")
                )
              )
            }
          />
        ),
        appearance.confirmationStatus === "DISCONFIRMED" ? (
          <MenuItem
            primaryText="Undisconfirm this appearance"
            key="undisconfirm-appearance"
            title="Remove your assertion that the entity does NOT appear at this media excerpt."
            leftAddon={<MaterialSymbol icon="do_not_disturb_off" />}
            onClick={() =>
              dispatch(
                flows.apiActionOnSuccess(
                  api.undisconfirmAppearance(appearanceId),
                  app.addToast("Undisconfirmed the appearance.")
                )
              )
            }
          />
        ) : (
          <MenuItem
            primaryText="Disconfirm this appearance"
            key="disconfirm-appearance"
            title="Assert that the entity does NOT appear at this media excerpt."
            leftAddon={<MaterialSymbol icon="do_not_disturb_on" />}
            onClick={() =>
              dispatch(
                flows.apiActionOnSuccess(
                  api.disconfirmAppearance(appearanceId),
                  app.addToast("Disconfirmed the appearance.")
                )
              )
            }
          />
        ),
      ]}
    />
  ) : undefined;

  return (
    <Page>
      <HowdjuHelmet>
        <title>{title} — Howdju</title>
      </HowdjuHelmet>
      <h1>{title}</h1>
      <FocusValidatingContextTrail
        id="appearance-page-context-trail"
        focusEntityType="APPEARANCE"
        focusEntityId={appearanceId}
      />
      {appearance ? (
        <SingleColumnGrid>
          <AppearanceCard
            id="appearance-page--appearance-card"
            appearance={appearance}
            contextTrailItems={contextTrailItems}
            menu={menu}
          />
        </SingleColumnGrid>
      ) : (
        <CircularProgress id="appearance-page--progress" />
      )}
    </Page>
  );
}
