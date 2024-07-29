import React, { Component } from "react";

import SolidButton from "@/components/button/SolidButton";
import { Card, CardContent } from "@/components/card/Card";
import { Page } from "@/components/layout/Page";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { showPrivacyConsentDialog } from "@/cookieConsent";
import Helmet from "@/Helmet";

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
      <Page>
        <Helmet>
          <title>Privacy Settings — Howdju</title>
        </Helmet>
        <SingleColumnGrid>
          <Card title="Privacy settings">
            <CardContent>
              <SolidButton onClick={showPrivacyConsentDialog}>
                Show privacy consent dialog
              </SolidButton>
            </CardContent>
          </Card>
        </SingleColumnGrid>
      </Page>
    );
  }
}
