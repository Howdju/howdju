import React  from 'react'

import RecentStatementsWidget from "./RecentStatementsWidget";
import RecentCitationsWidget from "./RecentCitationsWidget";
import RecentCitationReferencesWidget from './RecentCitationReferencesWidget'
import RecentJustificationsWidget from './RecentJustificationsWidget'

const recentStatementsWidgetId = 'RecentActivityPage.recentStatementsWidgetId'
const recentCitationsWidgetId = 'RecentActivityPage.recentCitationsWidgetId'
const recentCitationReferencesWidgetId = 'RecentActivityPage.recentCitationReferencesWidgetId'
const recentJustificationsWidgetId = 'RecentActivityPage.recentJustificationsWidgetId'

export default props => (
    <div className="md-grid">
      <h1 className="md-cell--12">Recent statements</h1>
      <RecentStatementsWidget id="recent-activity-page-statements"
                              className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                              widgetId={recentStatementsWidgetId}
      />

      <h1 className="md-cell--12">Recent quotes</h1>
      <RecentCitationReferencesWidget id="recent-activity-page-citation-references"
                                      className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                                      widgetId={recentCitationReferencesWidgetId}
      />

      <h1 className="md-cell--12">Recent citations</h1>
      <RecentCitationsWidget id="recent-activity-page-citations"
                             className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                             widgetId={recentCitationsWidgetId}
      />


      <h1 className="md-cell--12">Recent justifications</h1>
      <RecentJustificationsWidget id="recent-activity-page-justifications"
                                  className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                                  widgetId={recentJustificationsWidgetId}
      />
    </div>
)