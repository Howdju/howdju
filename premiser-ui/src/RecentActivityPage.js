import React, { Component } from 'react'
import RecentStatements from "./RecentStatements";
import RecentCitations from "./RecentCitations";
import RecentJustifications from './RecentJustifications'

const recentStatementsWidgetId = 'RecentActivityPage.recentStatementsWidgetId'
const recentCitationsWidgetId = 'RecentActivityPage.recentCitationsWidgetId'
const recentJustificationsWidgetId = 'RecentActivityPage.recentJustificationsWidgetId'

export default props => (
    <div>
      <h1>Recent statements</h1>
      <RecentStatements widgetId={recentStatementsWidgetId} />

      <h1>Recent citations</h1>
      <RecentCitations widgetId={recentCitationsWidgetId} />

      <h1>Recent justifications</h1>
      <RecentJustifications widgetId={recentJustificationsWidgetId} />
    </div>
)