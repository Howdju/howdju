import React, { Component } from "react";
import { Card, CardText } from "react-md";

import SolidButton from "@/components/button/SolidButton";
import Helmet from "./Helmet";
import { showPrivacyConsentDialog } from "./cookieConsent";

/**
 * A page where a user an access their privacy settings. Provided so that there is a URL to navigate directly to
 * from the privacy policy. If we had better tab/react-router integration, we would just link to the settings page
 */
export default class PrivacySettingsPage extends Component {
  componentDidMount() {
    showPrivacyConsentDialog();
  }

  render() {
    return (
      <div className="md-grid">
        <Helmet>
          <title>Privacy Settings — Howdju</title>
        </Helmet>
        <Card className="md-cell--12">
          <CardText>
            <h1 className="md-cell md-cell--12">Privacy Settings</h1>
            <SolidButton onClick={showPrivacyConsentDialog}>
              Show privacy consent dialog
            </SolidButton>
          </CardText>
        </Card>
      </div>
    );
  }
}
