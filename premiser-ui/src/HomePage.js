import React, { Component } from 'react'
import Tabs from 'react-md/lib/Tabs/Tabs';
import Tab from 'react-md/lib/Tabs/Tab';
import TabsContainer from 'react-md/lib/Tabs/TabsContainer';

import RecentStatementsCard from "./RecentStatementsCard";
import FeaturedPerspectives from './FeaturedPerspectives'

export default class HomePage extends Component {

  constructor() {
    super()

    this.state = {
      activeTabIndex: 0
    }
  }

  setTabsContainer = (tabsContainer) => {
    this._tabsContainer = tabsContainer
  }

  onTabAsyncChange = () => {
    this._tabsContainer.forceUpdate()
  }

  onTabChange = (newActiveTabIndex, tabId, tabControlsId, tabChildren, event) => {
    this.setState({activeTabIndex: newActiveTabIndex})
  }

  render () {
    const {activeTabIndex} = this.state
    return (
      <TabsContainer
          activeTabIndex={activeTabIndex}
          onTabChange={this.onTabChange}
          panelClassName="md-grid"
          ref={this.setTabsContainer}
          colored
      >
        <Tabs
            tabId="homePageTab"
            centered
            className="toolbarTabs"
        >
          <Tab label="Featured perspectives">
            <div className="md-cell md-cell--12">
              <FeaturedPerspectives widgetId={HomePage.featuredPerspectivesWidgetId}
                                    onPerspectivesLengthChange={this.onTabAsyncChange}
              />
            </div>
          </Tab>
          <Tab label="Recent activity">
            <div className="md-cell md-cell--12">
              <h1>Recently created statements</h1>
              <RecentStatementsCard widgetId={HomePage.recentStatementsWidgetId}
                                    onRecentStatementsLengthChange={this.onTabAsyncChange}
              />
            </div>
          </Tab>
          <Tab label="What's next">
            <div className="md-cell md-cell--12">
              <h3>This is what things will look like soon</h3>
              <p>Much ado about nothing.</p>
            </div>
          </Tab>
          <Tab label="About">
            <div className="md-cell md-cell--12">
              <h3>About</h3>
              <p>Much ado about nothing.</p>
            </div>
          </Tab>
        </Tabs>
      </TabsContainer>
    )
  }
}
HomePage.recentStatementsWidgetId = 'HomePage.recentStatementsWidgetId'
HomePage.featuredPerspectivesWidgetId = 'HomePage.featuredPerspectivesWidgetId'