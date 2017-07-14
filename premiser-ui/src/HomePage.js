import React, { Component } from 'react'
import RecentStatementsCard from "./RecentStatementsCard";

export default class HomePage extends Component {

  render () {
    return (
        <div className="md-grid">
          <div className="md-cell md-cell--6">
            <RecentStatementsCard widgetId={HomePage.recentStatementsWidgetId} />
          </div>
        </div>
    )
  }
}
HomePage.recentStatementsWidgetId = 'HomePage.recentStatementsWidgetId'