import React  from 'react'

import RecentStatements from "./RecentStatements";
import RecentCitations from "./RecentCitations";
import RecentCitationReferences from './RecentCitationReferences'
import RecentJustifications from './RecentJustifications'

const recentStatementsWidgetId = 'RecentActivityPage.recentStatementsWidgetId'
const recentCitationsWidgetId = 'RecentActivityPage.recentCitationsWidgetId'
const recentCitationReferencesWidgetId = 'RecentActivityPage.recentCitationReferencesWidgetId'
const recentJustificationsWidgetId = 'RecentActivityPage.recentJustificationsWidgetId'

export default props => (
    <div className="md-grid">
      <h1 className="md-cell--12">Recent statements</h1>
      <RecentStatements className="md-grid md-cell md-cell--12 md-grid--card-list--tablet" widgetId={recentStatementsWidgetId} />

      <h1 className="md-cell--12">Recent quotes</h1>
      <RecentCitationReferences className="md-grid md-cell md-cell--12 md-grid--card-list--tablet" widgetId={recentCitationReferencesWidgetId} />

      <h1 className="md-cell--12">Recent citations</h1>
      <RecentCitations className="md-grid md-cell md-cell--12 md-grid--card-list--tablet" widgetId={recentCitationsWidgetId} />

      <h1 className="md-cell--12">Recent justifications</h1>
      <RecentJustifications className="md-grid md-cell md-cell--12 md-grid--card-list--tablet" widgetId={recentJustificationsWidgetId} />
    </div>
)