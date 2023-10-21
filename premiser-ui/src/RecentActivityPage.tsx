import React from "react";

import RecentPropositionsWidget from "./RecentPropositionsWidget";
import RecentJustificationsWidget from "./RecentJustificationsWidget";
import RecentMediaExcerptsWidget from "./RecentMediaExcerptsWidget";
import RecentAppearancesWidget from "./RecentAppearancesWidget";

const recentPropositionsWidgetId =
  "RecentActivityPage.recentPropositionsWidgetId";
const recentMediaExcerptsWidgetId =
  "RecentActivityPage.recentMediaExcerptsWidgetId";
const recentAppearancesWidgetId =
  "RecentActivityPage.recentAppearancesWidgetId";
const recentJustificationsWidgetId =
  "RecentActivityPage.recentJustificationsWidgetId";

export default function RecentActivityPage() {
  return (
    <div>
      <h1>Recent propositions</h1>
      <RecentPropositionsWidget
        id="recent-activity-page-propositions"
        widgetId={recentPropositionsWidgetId}
      />

      <h1>Recent media excerpts</h1>
      <RecentMediaExcerptsWidget
        id="recent-activity-page-media-excerpts"
        widgetId={recentMediaExcerptsWidgetId}
      />

      <h1>Recent appearances</h1>
      <RecentAppearancesWidget
        id="recent-activity-page-appearances"
        widgetId={recentAppearancesWidgetId}
      />

      <h1>Recent justifications</h1>
      <RecentJustificationsWidget
        id="recent-activity-page-justifications"
        widgetId={recentJustificationsWidgetId}
      />
    </div>
  );
}
