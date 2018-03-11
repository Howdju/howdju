import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router'
import { Link } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import Helmet from 'react-helmet'
import {
  Button,
  Drawer,
  ListItem,
  FontIcon,
  Snackbar,
  Toolbar,
  Tabs,
  Tab,
} from 'react-md'
import { connect } from 'react-redux'
import cn from 'classnames'
import get from 'lodash/get'
import isFinite from 'lodash/isFinite'
import map from 'lodash/map'
import throttle from 'lodash/throttle'

import {
  isTruthy
} from 'howdju-common'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {history} from './configureStore'
import paths, {createJustificationPath} from './paths'
import mainSearcher from './mainSearcher'
import {
  selectIsWindowNarrow,
  selectAuthToken,
  selectAuthEmail,
} from "./selectors"
import * as smallchat from './smallchat'
import {
  isScrollPastBottom,
  isScrollPastTop,
  isDevice,
} from "./util"
import t, {
  MAIN_TABS_FEATURED_PERSPECTIVES_TAB_NAME,
  MAIN_TABS_RECENT_ACTIVITY_TAB_NAME,
  MAIN_TABS_WHATS_NEXT_TAB_NAME,
  MAIN_TABS_ABOUT_TAB_NAME,
} from "./texts"
import {readOrCreateSessionStorageId, readOrCreateSessionCookieId} from "./identifiers"

import Header from './Header'
import MainSearchPage from './MainSearchPage'
import ToolsPage from './ToolsPage'
import PrivacyPolicyPage from './PrivacyPolicyPage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'
import LandingPage from './LandingPage'
import IconPage from './IconPage'
import CreateStatementPage, {CreateStatementPageMode} from "./CreateStatementPage"
import FeaturedPerspectivesPage from "./FeaturedPerspectivesPage"
import RecentActivityPage from "./RecentActivityPage"
import WhatsNextPage from "./WhatsNextPage"
import AboutPage from "./AboutPage"
import NotFoundPage from "./NotFoundPage"
import JustificationsSearchPage from "./JustificationsSearchPage"
import TagPage from './TagPage'

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
      windowPageYOffset: window.pageYOffset,
      isOverscrolledTop: false,
      isOverscrolledBottom: false,
    }

    this.throttledOnWindowScroll = throttle(this.onWindowScroll, 100)

    readOrCreateSessionStorageId()
    readOrCreateSessionCookieId()
  }

  componentWillMount() {
    this.unlistenToHistory = history.listen(this.onHistoryListen)
  }

  componentDidMount() {
    this.initializeTabIndex()
    window.addEventListener('resize', this.onWindowResize)
    window.addEventListener('scroll', this.throttledOnWindowScroll)
  }

  componentWillUnmount() {
    if (this.unlistenToHistory) this.unlistenToHistory()
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('scroll', this.throttledOnWindowScroll)
  }

  onWindowResize = () => {
    this.context.store.dispatch(ui.windowResize())
  }

  updateOverscrollState = () => {
    if (isScrollPastTop()) {
      this.setState({
        isOverscrolledTop: true,
        isOverscrolledBottom: false,
      })
    } else if (isScrollPastBottom()) {
      this.setState({
        isOverscrolledTop: false,
        isOverscrolledBottom: true,
      })
    }
  }

  updateSmallchatLauncherVisibility = () => {
    // The smallchat tab obscures UI (context menus and dialog buttons) on narrow screens.  Show allow the user to hide
    // it by scrolling down.
    const didScrollDown = window.pageYOffset > this.state.windowPageYOffset
    const didScrollUp = window.pageYOffset < this.state.windowPageYOffset
    const {
      isOverscrolledTop,
      isOverscrolledBottom,
    } = this.state
    if (didScrollDown && !isOverscrolledTop) {
      smallchat.hide()
    } else if (didScrollUp && !isOverscrolledBottom) {
      smallchat.show()
    }
  }

  resetOverscrollState = () => {
    const newState = {
      windowPageYOffset: window.pageYOffset
    }
    // reset overscrolls
    if (this.state.isOverscrolledTop && !isScrollPastTop()) {
      newState.isOverscrolledTop = false
    }
    if (this.state.isOverscrolledBottom && !isScrollPastBottom()) {
      newState.isOverscrolledBottom = false
    }
    this.setState(newState)
  }

  onWindowScroll = () => {

    this.updateOverscrollState()

    // The code below won't necessarily see the state updates from above and that should be okay.
    // I think we expect the scroll events that need to respond to overscrolls to occur many throttled-events after
    // the overscroll is detected.

    this.updateSmallchatLauncherVisibility()

    this.resetOverscrollState()
  }

  initializeTabIndex = () => {
    this.syncTabToPathname(window.location.pathname)
  }

  logout = () => {
    this.props.api.logout()
  }

  hideNavDrawer = () => {
    this.props.ui.hideNavDrawer()
  }

  onNavDrawerVisibilityChange = (visible) => {
    this.props.ui.setNavDrawerVisibility({visible})
  }

  dismissSnackbar = () => {
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

  syncTabToPathname = (pathname) => {
    const index = get(tabIndexByPathname, pathname, -1)
    this.setState({activeTabIndex: index})
  }

  onClickApp = (event) => {
    this.props.ui.unhandledAppClick()
  }

  disableMobileSite = () => {
    this.props.ui.disableMobileSite()
  }

  enableMobileSite = () => {
    this.props.ui.enableMobileSite()
  }

  render () {
    const {
      authEmail,
      hasAuthToken,
      isNavDrawerVisible,
      toasts,
      isMobileSiteDisabled,
    } = this.props
    const {
      activeTabIndex
    } = this.state

    const navItems = [
      <ListItem key="home"
                primaryText="Home"
                leftIcon={<FontIcon>home</FontIcon>}
                component={Link}
                to={paths.home()}
      />,
      <ListItem key="createStatement"
                primaryText="Make a statement"
                leftIcon={<FontIcon>add</FontIcon>}
                component={Link}
                to="/create-statement"
      />,
      <ListItem key="tools"
                primaryText="Tools"
                leftIcon={<FontIcon>build</FontIcon>}
                component={Link}
                to={paths.tools()}
      />,
      <ListItem key="privacy"
                primaryText="Privacy Policy"
                leftIcon={<FontIcon>laptop_chromebook</FontIcon>}
                component={Link}
                to={paths.privacyPolicy()}
      />,
    ]
    if (isDevice()) {
      if (isMobileSiteDisabled) {
        navItems.push(
          <ListItem key="mobile-site"
                    primaryText="Mobile site"
                    leftIcon={<FontIcon>smartphone</FontIcon>}
                    onClick={this.enableMobileSite}
          />
        )
      } else {
        navItems.push(
          <ListItem key="desktop-site"
                    primaryText="Desktop site"
                    leftIcon={<FontIcon>desktop_windows</FontIcon>}
                    onClick={this.disableMobileSite}
          />
        )
      }
    }
    if (hasAuthToken) {
      navItems.push(
        <ListItem key="logout"
                  primaryText="Logout"
                  leftIcon={<FontIcon>exit_to_app</FontIcon>}
                  onClick={this.logout}
        />
      )
    } else {
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
            nav={<Button icon onClick={this.hideNavDrawer}>close</Button>}
            className="md-divider-border md-divider-border--bottom"
          >
            <div className="app-nav-drawer-header">
              {authEmail ? (
                  <div>
                    <b>{authEmail}</b>
                    {hasAuthToken || <div><em>login expired</em></div>}
                  </div>
                )
                : <em>Not logged in</em>
              }
            </div>
          </Toolbar>
        }
        navItems={navItems}
        visible={isNavDrawerVisible}
        onVisibilityChange={this.onNavDrawerVisibilityChange}
        style={{ zIndex: 100 }}
      />)

    const renderHomePath = props => {
      const mainSearchText = mainSearcher.mainSearchText(props.location)
      return mainSearchText ?
        <MainSearchPage {...props} /> :
        <LandingPage/>
    }

    const tabInfos = [
      {
        path: paths.featuredPerspectives(),
        text: t(MAIN_TABS_FEATURED_PERSPECTIVES_TAB_NAME),
        id: "featured-perspectives-tab"
      },
      {
        path: paths.recentActivity(),
        text: t(MAIN_TABS_RECENT_ACTIVITY_TAB_NAME),
        id: "recent-activity-tab"
      },
      {
        path: paths.whatsNext(),
        text: t(MAIN_TABS_WHATS_NEXT_TAB_NAME),
        id: "whats-next-tab"
      },
      {
        path: paths.about(),
        text: t(MAIN_TABS_ABOUT_TAB_NAME),
        id: "about-tab"
      },
    ]

    const pageTabs = (
      <Tabs
        tabId="mainTab"
        centered
        className="toolbarTabs"
        activeTabIndex={activeTabIndex}
        onTabChange={this.onTabChange}
        style={{position: 'absolute', left: 0, bottom: 0, right: 0}}
      >
        {map(tabInfos, ti => (
          <Tab label={
            <Link to={ti.path}>
              {ti.text}
            </Link>
          }
               id={ti.id}
               key={ti.id}
          />
        ))}
      </Tabs>
    )

    const title = isFinite(activeTabIndex) && activeTabIndex >= 0 ?
      `${tabInfos[activeTabIndex].text} — Howdju` :
      'Howdju'

    const viewportContent = isMobileSiteDisabled ?
      'width=1024, initial-scale=1' :
      'width=device-width, initial-scale=1, user-scalable=no'

    return (
      <ConnectedRouter history={history}>
        <div id="app"
             onClick={this.onClickApp}
        >
          <Helmet>
            <title>{title}</title>
            <meta name="viewport" content={viewportContent} />
          </Helmet>

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
              <Route exact path="/tags/:tagId/:tagSlug?" component={TagPage} />
              <Route exact path="/search-justifications" component={JustificationsSearchPage} />

              <Route exact path="/create-statement" render={props => (
                <CreateStatementPage {...props} mode={CreateStatementPageMode.CREATE_STATEMENT} />
              )} />
              <Route exact path={createJustificationPath} render={props => (
                <CreateStatementPage {...props} mode={CreateStatementPageMode.CREATE_JUSTIFICATION} />
              )} />
              <Route exact path="/submit" render={props => (
                <CreateStatementPage {...props} mode={CreateStatementPageMode.SUBMIT_JUSTIFICATION} />
              )} />

              <Route exact path="/tools" component={ToolsPage} />
              <Route exact path={paths.privacyPolicy()} component={PrivacyPolicyPage} />
              <Route exact path="/icons" component={IconPage} />

              <Route component={NotFoundPage} />
            </Switch>

          </div>

          <Snackbar toasts={toasts} onDismiss={this.dismissSnackbar} />

        </div>
      </ConnectedRouter>
    )
  }
}
App.contextTypes = {
  store: PropTypes.object
}

const mapStateToProps = state => {
  const {
    ui,
  } = state
  const authEmail = selectAuthEmail(state)
  const hasAuthToken = isTruthy(selectAuthToken(state))
  const isNavDrawerVisible = get(ui, ['app', 'isNavDrawerVisible'])
  const toasts = get(ui, ['app', 'toasts'])

  const isMobileSiteDisabled = get(ui, ['app', 'isMobileSiteDisabled'])

  const isWindowNarrow = selectIsWindowNarrow(state)

  return {
    authEmail,
    hasAuthToken,
    isNavDrawerVisible,
    toasts,
    isWindowNarrow,
    isMobileSiteDisabled,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(App)