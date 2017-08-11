import React, { Component } from 'react'
import { Route, Switch } from 'react-router'
import { Link, Redirect } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import DocumentTitle from 'react-document-title'
import Button from 'react-md/lib/Buttons/Button'
import Drawer from 'react-md/lib/Drawers/Drawer';
import ListItem from 'react-md/lib/Lists/ListItem'
import FontIcon from 'react-md/lib/FontIcons'
import Snackbar from 'react-md/lib/Snackbars'
import Toolbar from 'react-md/lib/Toolbars';
import Tabs from 'react-md/lib/Tabs/Tabs';
import Tab from 'react-md/lib/Tabs/Tab'
import { connect } from 'react-redux'
import cn from 'classnames'
import get from 'lodash/get'

import Header from './Header'
import MainSearchPage from './MainSearchPage'
import ToolsPage from './ToolsPage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'
import {
  api,
  app,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions";
import {history} from './configureStore'
import paths, {createJustificationPath, mainSearchPathName} from "./paths";
import mainSearcher from './mainSearcher'
import IconPage from './IconPage'
import EditStatementJustificationPage, {EditStatementJustificationPageMode} from "./EditStatementJustificationPage";
import FeaturedPerspectivesPage from "./FeaturedPerspectivesPage";
import RecentActivityPage from "./RecentActivityPage";
import WhatsNextPage from "./WhatsNextPage";
import AboutPage from "./AboutPage";
import NotFoundPage from "./NotFoundPage";
import JustificationsSearchPage from "./JustificationsSearchPage";
import t, {
  MAIN_TABS_FEATURED_PERSPECTIVES_TAB_NAME,
  MAIN_TABS_RECENT_ACTIVITY_TAB_NAME,
  MAIN_TABS_WHATS_NEXT_TAB_NAME,
  MAIN_TABS_ABOUT_TAB_NAME,
} from "./texts";

import './fonts.js'
import './App.scss'

const tabIndexByPathname = {
  '/featured-perspectives': 0,
  '/recent-activity': 1,
  '/whats-next': 2,
  '/about-tab': 3,
}

class App extends Component {

  constructor() {
    super()

    this.state = {
      activeTabIndex: 0,
    }

    this.handleLogout = this.handleLogout.bind(this)
    this.handleHideNavDrawer = this.handleHideNavDrawer.bind(this)
    this.onNavDrawerVisibilityChange = this.onNavDrawerVisibilityChange.bind(this)
    this.onSnackbarDismiss = this.onSnackbarDismiss.bind(this)
  }

  componentWillMount() {
    this.unlistenToHistory = history.listen(this.onHistoryListen)
  }

  componentDidMount() {
    this.checkInitializeMainSearch()
    this.initializeTabIndex()
  }

  componentWillUnmount() {
    if (this.unlistenToHistory) this.unlistenToHistory()
  }

  checkInitializeMainSearch() {
    const location = window.location
    if (location.pathname === mainSearchPathName) {
      const queryParamSearchText = mainSearcher.mainSearchText(location)
      if (queryParamSearchText) {
        this.props.app.initializeMainSearch(queryParamSearchText)
      }
    }
  }

  initializeTabIndex = () => {
    this.syncTabToPathname(window.location.pathname)
  }

  handleLogout() {
    this.props.api.logout()
  }

  handleHideNavDrawer() {
    this.props.ui.hideNavDrawer()
  }

  onNavDrawerVisibilityChange(visible) {
    this.props.ui.setNavDrawerVisibility({visible})
  }

  onSnackbarDismiss() {
    this.props.ui.dismissToast()
  }

  onTabChange = (newActiveTabIndex, tabId, tabControlsId, tabChildren, event) => {
    const lookup = {
      'featured-perspectives-tab': paths.featuredPerspectives(),
      'recent-activity-tab': paths.recentActivity(),
      'whats-next-tab': paths.whatsNext(),
      'about-tab': paths.about()
    }
    const path = lookup[tabId]
    history.push(path)
    this.setState({activeTabIndex: newActiveTabIndex})
  }

  onHistoryListen = (location, action) => {
    this.syncTabToPathname(location.pathname)
  }

  syncTabToPathname = pathname => {
    const index = get(tabIndexByPathname, pathname, -1)
    this.setState({activeTabIndex: index})
  }

  onClick = event => {
    this.props.ui.unhandledAppClick()
  }

  render () {
    const {
      authToken,
      email,
      isNavDrawerVisible,
      toasts,
    } = this.props
    const {
      activeTabIndex
    } = this.state

    const navItems = [
      <ListItem key="home"
                primaryText="Home"
                leftIcon={<FontIcon>home</FontIcon>}
                component={Link}
                to="/"
      />,
      <ListItem key="createStatement"
                primaryText="Make a Statement"
                leftIcon={<FontIcon>add</FontIcon>}
                component={Link}
                to="/create-statement"
      />,
      <ListItem key="tools"
                primaryText="Tools"
                leftIcon={<FontIcon>build</FontIcon>}
                component={Link}
                to="/tools"
      />,
    ]
    if (authToken) {
      navItems.push(
          <ListItem key="logout"
                    primaryText="Logout"
                    leftIcon={<FontIcon>exit_to_app</FontIcon>}
                    onClick={this.handleLogout}
          />
      )
    }
    if (!authToken) {
      navItems.push(
          <ListItem key="login"
                    primaryText="Login"
                    leftIcon={<FontIcon>https</FontIcon>}
                    component={Link}
                    to="/login"
          />
      )
    }

    const navDrawer = (
        <Drawer
            id="app-nav-drawer"
            position="right"
            type={Drawer.DrawerTypes.TEMPORARY}
            header={
              <Toolbar
                  nav={<Button icon onClick={this.handleHideNavDrawer}>close</Button>}
                  className="md-divider-border md-divider-border--bottom"
              >
                {authToken &&
                  <div className="app-nav-drawer-header">
                    <b>{email}</b>
                  </div>
                }
              </Toolbar>
            }
            navItems={navItems}
            visible={isNavDrawerVisible}
            onVisibilityToggle={this.onNavDrawerVisibilityChange}
            style={{ zIndex: 100 }}
        />)

    const renderHomePath = props => {
      const mainSearchText = mainSearcher.mainSearchText(props.location)
      return mainSearchText ?
          <MainSearchPage {...props} /> :
          <Redirect to={{pathname: '/featured-perspectives'}}/>
    }

    const pageTabs = (
        <Tabs
            tabId="mainTab"
            centered
            className="toolbarTabs"
            activeTabIndex={activeTabIndex}
            onTabChange={this.onTabChange}
            style={{position: 'absolute', left: 0, bottom: 0, right: 0}}
        >
          <Tab label={
                 <Link to={paths.featuredPerspectives()}>
                   {t(MAIN_TABS_FEATURED_PERSPECTIVES_TAB_NAME)}
                 </Link>
               }
               id="featured-perspectives-tab"
          />
          <Tab label={
                 <Link to={paths.recentActivity()}>
                   {t(MAIN_TABS_RECENT_ACTIVITY_TAB_NAME)}
                 </Link>
               }
               id="recent-activity-tab"
          />
          <Tab label={
                 <Link to={paths.whatsNext()}>
                   {t(MAIN_TABS_WHATS_NEXT_TAB_NAME)}
                 </Link>
               }
               id="whats-next-tab"
          />
          <Tab label={
                 <Link to={paths.about()}>
                   {t(MAIN_TABS_ABOUT_TAB_NAME)}
                 </Link>
               }
               id="about-tab"
          />
        </Tabs>
    )

    return (
      <DocumentTitle title="Howdju">
        <ConnectedRouter history={history}>
          <div id="app"
               onClick={this.onClick}
          >

            <Header tabs={pageTabs} />

            {navDrawer}

            <div id="page" className={cn({
              "md-toolbar-relative": !pageTabs,
              "md-toolbar-relative--prominent": !!pageTabs,
            })}>

              <Switch>
                <Route exact path={paths.home()} render={renderHomePath}/>
                <Route exact path={paths.login()} component={LoginPage} />

                <Route exact path={paths.featuredPerspectives()} component={FeaturedPerspectivesPage} />
                <Route exact path={paths.recentActivity()} component={RecentActivityPage} />
                <Route exact path={paths.whatsNext()} component={WhatsNextPage} />
                <Route exact path={paths.about()} component={AboutPage} />

                <Route exact path="/s/:statementId/:statementSlug?" component={StatementJustificationsPage} />
                <Route exact path="/search-justifications" component={JustificationsSearchPage} />

                <Route exact path="/create-statement" render={props => (
                    <EditStatementJustificationPage {...props} mode={EditStatementJustificationPageMode.CREATE_STATEMENT} />
                )} />
                <Route exact path={createJustificationPath} render={props => (
                    <EditStatementJustificationPage {...props} mode={EditStatementJustificationPageMode.CREATE_JUSTIFICATION} />
                )} />
                <Route exact path="/submit" render={props => (
                    <EditStatementJustificationPage {...props} mode={EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION} />
                )} />

                <Route exact path="/tools" component={ToolsPage} />
                <Route exact path="/icons" component={IconPage} />

                <Route component={NotFoundPage} />
              </Switch>

            </div>

            <Snackbar toasts={toasts} onDismiss={this.onSnackbarDismiss} />

          </div>
        </ConnectedRouter>
      </DocumentTitle>
    )
  }
}

const mapStateToProps = state => {
  const {
    auth,
    ui,
  } = state
  const email = get(auth, ['user', 'email'])
  const authToken = auth.authToken
  const isNavDrawerVisible = get(ui, ['app', 'isNavDrawerVisible'])
  const toasts = get(ui, ['app', 'toasts'])
  return {
    email,
    authToken,
    isNavDrawerVisible,
    toasts,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  app,
  ui,
}))(App)