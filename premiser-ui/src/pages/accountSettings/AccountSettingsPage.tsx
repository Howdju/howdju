import React, { useEffect } from "react";
import { Card, CardActions, CardText, CardTitle } from "react-md";

import Helmet from "../../Helmet";
import EditableAccountSettings from "./EditableAccountSettings";
import { defaultEditorState, EditorTypes } from "../../reducers/editors";
import { combineIds } from "../../viewModels";
import { api, editors } from "../../actions";
import t, { EDIT_ENTITY_BUTTON_LABEL } from "../../texts";
import { isTruthy } from "howdju-common";
import { showPrivacyConsentDialog } from "../../cookieConsent";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { logger } from "@/logger";
import OutlineButton from "@/components/button/OutlineButton";

const baseId = "accountSettingsPage";
const accountSettingsId = combineIds(baseId, "accountSettings");
const accountSettingsEditorId = combineIds(baseId, "accountSettings");

export default function AccountSettingsPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(api.fetchAccountSettings());
  }, [dispatch]);

  const { isFetching, accountSettings } = useAppSelector(
    (state) => state.accountSettingsPage
  );
  const { editEntity } = useAppSelector(
    (state) =>
      state.editors.ACCOUNT_SETTINGS?.[accountSettingsEditorId] ||
      defaultEditorState()
  );
  const isEditing = isTruthy(editEntity);

  const beginEdit = () => {
    if (!accountSettings) {
      logger.error(
        "Can't beginEdit because the accountSettings aren't loaded."
      );
      return;
    }
    dispatch(
      editors.beginEdit(
        EditorTypes.ACCOUNT_SETTINGS,
        accountSettingsEditorId,
        accountSettings
      )
    );
  };

  return (
    <div className="md-grid">
      <div className="md-cell md-cell--12">
        <Helmet>
          <title>Settings — Howdju</title>
        </Helmet>

        <h1>Settings</h1>

        <Card className="md-cell--12">
          <CardTitle
            title="Profile"
            subtitle="Your profile is the part of your account settings that are visible to other users"
          />
          <CardText>
            <EditableAccountSettings
              id={accountSettingsId}
              name="accountSettings"
              editorId={accountSettingsEditorId}
              className="md-cell md-cell--12"
              accountSettings={accountSettings}
              suggestionsKey="accountSettings"
            />
          </CardText>
          <CardActions>
            {!isEditing && (
              <OutlineButton
                key="editButton"
                disabled={isFetching}
                onClick={beginEdit}
              >
                {t(EDIT_ENTITY_BUTTON_LABEL)}
              </OutlineButton>
            )}
          </CardActions>
        </Card>
      </div>
      <div className="md-cell md-cell--12">
        <Card className="md-cell--12">
          <CardTitle title="Privacy settings" />
          <CardText>
            <OutlineButton onClick={showPrivacyConsentDialog}>
              Show privacy consent dialog
            </OutlineButton>
          </CardText>
        </Card>
      </div>
    </div>
  );
}
