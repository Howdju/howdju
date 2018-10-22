import React  from 'react'

import RecentPropositionsWidget from "./RecentPropositionsWidget"
import RecentWritsWidget from "./RecentWritsWidget"
import RecentWritQuotesWidget from './RecentWritQuotesWidget'
import RecentJustificationsWidget from './RecentJustificationsWidget'

const recentPropositionsWidgetId = 'RecentActivityPage.recentPropositionsWidgetId'
const recentWritsWidgetId = 'RecentActivityPage.recentWritsWidgetId'
const recentWritQuotesWidgetId = 'RecentActivityPage.recentWritQuotesWidgetId'
const recentJustificationsWidgetId = 'RecentActivityPage.recentJustificationsWidgetId'

const RecentActivityPage = (props) => (
  <div className="md-grid">
    <h1 className="md-cell--12">Recent propositions</h1>
    <RecentPropositionsWidget
      id="recent-activity-page-propositions"
      className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
      widgetId={recentPropositionsWidgetId}
    />

    <h1 className="md-cell--12">Recent quotes</h1>
    <RecentWritQuotesWidget
      id="recent-activity-page-writ-quotes"
      className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
      widgetId={recentWritQuotesWidgetId}
    />

    <h1 className="md-cell--12">Recent citations</h1>
    <RecentWritsWidget
      id="recent-activity-page-writs"
      className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
      widgetId={recentWritsWidgetId}
    />

    <h1 className="md-cell--12">Recent justifications</h1>
    <RecentJustificationsWidget
      id="recent-activity-page-justifications"
      className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
      widgetId={recentJustificationsWidgetId}
    />
  </div>
)
export default RecentActivityPage