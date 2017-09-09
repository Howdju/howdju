import React  from 'react'

import RecentStatementsWidget from "./RecentStatementsWidget"
import RecentWritingsWidget from "./RecentWritingsWidget"
import RecentWritingQuotesWidget from './RecentWritingQuotesWidget'
import RecentJustificationsWidget from './RecentJustificationsWidget'

const recentStatementsWidgetId = 'RecentActivityPage.recentStatementsWidgetId'
const recentWritingsWidgetId = 'RecentActivityPage.recentWritingsWidgetId'
const recentWritingQuotesWidgetId = 'RecentActivityPage.recentWritingQuotesWidgetId'
const recentJustificationsWidgetId = 'RecentActivityPage.recentJustificationsWidgetId'

const RecentActivityPage = props => (
  <div className="md-grid">
    <h1 className="md-cell--12">Recent statements</h1>
    <RecentStatementsWidget id="recent-activity-page-statements"
                            className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                            widgetId={recentStatementsWidgetId}
    />

    <h1 className="md-cell--12">Recent quotes</h1>
    <RecentWritingQuotesWidget id="recent-activity-page-writing-quotes"
                                    className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                                    widgetId={recentWritingQuotesWidgetId}
    />

    <h1 className="md-cell--12">Recent writings</h1>
    <RecentWritingsWidget id="recent-activity-page-writings"
                           className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                           widgetId={recentWritingsWidgetId}
    />


    <h1 className="md-cell--12">Recent justifications</h1>
    <RecentJustificationsWidget id="recent-activity-page-justifications"
                                className="md-grid md-cell md-cell--12 md-grid--card-list--tablet"
                                widgetId={recentJustificationsWidgetId}
    />
  </div>
)
export default RecentActivityPage