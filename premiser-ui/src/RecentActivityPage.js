import React, { Component } from 'react'
import RecentStatements from "./RecentStatements";

const widgetId = 'RecentActivityPage.recentStatementsWidgetId'

export default props => (
    <div>
      <h1>Recent statements</h1>
      <RecentStatements widgetId={widgetId} />

      <h1>Recent citations</h1>

      <h1>Recent justifications</h1>
    </div>
)