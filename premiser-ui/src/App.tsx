import React, { Component, ComponentClass, MouseEvent } from "react";
import { hot } from "react-hot-loader/root";
import { Switch } from "react-router";
import { Link } from "react-router-dom";
import { ConnectedRouter } from "connected-react-router";
import {
  Button,
  Drawer,
  ListItem,
  FontIcon,
  Snackbar,
  Toolbar,
  Tabs,
  Tab,
  TabsProps,
} from "react-md";
import { connect, ConnectedProps } from "react-redux";
import cn from "classnames";
import forEach from "lodash/forEach";
import isFinite from "lodash/isFinite";
import map from "lodash/map";
import throttle from "lodash/throttle";
import { IdPropType } from "react-md/lib";
import { Location, UnregisterCallback, Action } from "history";

import { isTruthy } from "howdju-common";
import { actions, inIframe } from "howdju-client-common";

import Helmet from "./Helmet";
import {
  api,
  flows,
  goto,
  privacyConsent,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions";
import config from "./config";
import {
  ANALYTICS,
  BASIC_FUNCTIONALITY,
  Cookie,
  cookieConsent,
  ERROR_REPORTING,
  fixConsentCookieIds,
  FULL_ERROR_REPORTING,
  isMissingPrivacyConsent,
  REQUIRED_FUNCTIONALITY,
  showPrivacyConsentDialog,
} from "./cookieConsent";
import app from "@/app/appSlice";
import { startPersisting, stopPersisting } from "./store";
import ErrorBoundary from "./ErrorBoundary";
import Header from "./Header";
import { history } from "./history";
import { logger } from "./logger";
import paths from "./paths";
import routes from "./routes";
import {
  selectAuthToken,
  selectAuthEmail,
  selectPrivacyConsent,
} from "./selectors";
import sentryInit from "./sentryInit";
import t, {
  MAIN_TABS_RECENT_ACTIVITY_TAB_NAME,
  MAIN_TABS_WHATS_NEXT_TAB_NAME,
  MAIN_TABS_ABOUT_TAB_NAME,
} from "./texts";
import { isScrollPastBottom, isScrollPastTop, isDevice } from "./util";
import WindowMessageHandler from "./WindowMessageHandler";
import ReportContentDialog from "./content-report/ReportContentDialog";
import { RootState } from "./setupStore";

import "./App.scss";
import "./fonts.js";

const tabInfos = [
  {
    path: paths.recentActivity(),
    text: t(MAIN_TABS_RECENT_ACTIVITY_TAB_NAME),
    id: "recent-activity-tab",
  },
  {
    path: paths.whatsNext(),
    text: t(MAIN_TABS_WHATS_NEXT_TAB_NAME),
    id: "whats-next-tab",
  },
  {
    path: paths.about(),
    text: t(MAIN_TABS_ABOUT_TAB_NAME),
    id: "about-tab",
  },
];

class App extends Component<Props> {
  throttledOnWindowScroll: () => void;
  unlistenToHistory?: UnregisterCallback;
  windowMessageHandler?: WindowMessageHandler;
  state = {
    activeTabIndex: 0,
    windowPageYOffset: window.pageYOffset,
    isOverscrolledTop: false,
    isOverscrolledBottom: false,
  };

  constructor(props: Props) {
    super(props);
    this.throttledOnWindowScroll = throttle(this.onWindowScroll, 100);
  }

  componentDidMount() {
    this.unlistenToHistory = history.listen(this.onHistoryListen);
    this.initializeTabIndex();
    window.addEventListener("resize", this.onWindowResize, false);
    window.addEventListener("scroll", this.throttledOnWindowScroll, false);
    window.addEventListener("message", this.receiveMessage, false);

    this.windowMessageHandler = new WindowMessageHandler({
      beginEditOfNewJustificationFromAnchorInfo:
        this.props.flows.submitMediaExcerptFromAnchorInfo,
      gotoJustification: this.props.goto.justification,
      extensionFrameAckMessage: this.props.extensionFrame.ackMessage,
    });
    if (inIframe()) {
      this.props.extension.messageHandlerReady();
    }

    // Persist the current settings first in case cookieConsent.on('update') fires.
    this.props.privacyConsent.update(cookieConsent.getPreferences());
    this.initPrivacyConsent(cookieConsent.getPreferences());
    // setTimeout: load the cookie consent after the privacyConsent.update has had a chance to occur.
    setTimeout(() => cookieConsent.on("update", this.onCookieConsentUpdate));
    if (isMissingPrivacyConsent()) {
      showPrivacyConsentDialog();
    }
  }

  /** Read the current privacy consent and perform any initializations */
  initPrivacyConsent = (cookies: Cookie[]) => {
    forEach(cookies, (cookie) => {
      switch (cookie.id) {
        case REQUIRED_FUNCTIONALITY:
          // Required functionality can't be changed, so there's never anything to do.
          break;
        case BASIC_FUNCTIONALITY:
          if (cookie.accepted) {
            startPersisting();
          }
          break;
        case ERROR_REPORTING:
          if (cookie.accepted) {
            sentryInit();
          }
          break;
        case FULL_ERROR_REPORTING:
          // sentryInit checks this
          break;
        case ANALYTICS:
          window.postMessage(
            { howdjuTrackingConsent: { enabled: cookie.accepted } },
            window.location.href
          );
          break;
        default:
          logger.error(`Unsupported cookie consent id: ${cookie.id}`);
          break;
      }
    });
  };

  onCookieConsentUpdate = (cookies: Cookie[]) => {
    let requiresReload = false;
    const privacyConsentState = this.props.privacyConsentState;
    forEach(cookies, (cookie) => {
      const prevCookie = privacyConsentState[cookie.id];
      if (prevCookie && cookie.accepted === prevCookie.accepted) {
        // Only process differences
        return;
      }
      let requestReload = false;
      switch (cookie.id) {
        case REQUIRED_FUNCTIONALITY:
          // Required functionality can't be changed, so there's never anything to do.
          break;
        case BASIC_FUNCTIONALITY:
          if (cookie.accepted) {
            startPersisting();
          } else {
            stopPersisting();
          }
          break;
        case ERROR_REPORTING:
          if (cookie.accepted) {
            sentryInit();
          } else {
            // Sentry's beforeSend checks this value before sending events
          }
          break;
        case FULL_ERROR_REPORTING:
          // sentryInit must handle this; it is not possible to update after initialization.
          requestReload = true;
          break;
        case ANALYTICS:
          window.postMessage(
            { howdjuTrackingConsent: { enabled: cookie.accepted } },
            window.location.href
          );
          requestReload = true;
          break;
        default:
          logger.error(`Unsupported cookie consent id: ${cookie.id}`);
          // Require reload just to be safe
          requestReload = true;
          // It's possible that the user has an old version of the cookie IDs.
          fixConsentCookieIds();
          break;
      }
      // Assume that functionality is disabled by default, and so if there is no previous cookie,
      // then we only need a reload if the functionality is now accepted.
      requiresReload =
        requiresReload ||
        (requestReload && (isTruthy(prevCookie) || cookie.accepted));
    });
    if (requiresReload) {
      this.props.app.addToast(
        "Please reload the page for changes to take effect."
      );
    }
    this.props.privacyConsent.update(cookies);
  };

  componentWillUnmount() {
    if (this.unlistenToHistory) this.unlistenToHistory();
    window.removeEventListener("resize", this.onWindowResize);
    window.removeEventListener("scroll", this.throttledOnWindowScroll);
    window.removeEventListener("message", this.receiveMessage);
  }

  receiveMessage = (event: MessageEvent) => {
    if (!this.windowMessageHandler) {
      logger.warn("Unable to handle window message.");
      return;
    }
    this.windowMessageHandler.handleEvent(event);
  };

  onWindowResize = () => {
    this.props.ui.windowResize();
  };

  updateOverscrollState = () => {
    if (isScrollPastTop()) {
      this.setState({
        isOverscrolledTop: true,
        isOverscrolledBottom: false,
      });
    } else if (isScrollPastBottom()) {
      this.setState({
        isOverscrolledTop: false,
        isOverscrolledBottom: true,
      });
    }
  };

  resetOverscrollState = () => {
    const newState: Partial<typeof this.state> = {
      windowPageYOffset: window.pageYOffset,
    };
    // reset overscrolls
    if (this.state.isOverscrolledTop && !isScrollPastTop()) {
      newState.isOverscrolledTop = false;
    }
    if (this.state.isOverscrolledBottom && !isScrollPastBottom()) {
      newState.isOverscrolledBottom = false;
    }
    this.setState(newState);
  };

  onWindowScroll = () => {
    this.updateOverscrollState();

    // The code below won't necessarily see the state updates from above and that should be okay.
    // I think we expect the scroll events that need to respond to overscrolls to occur many throttled-events after
    // the overscroll is detected.

    this.resetOverscrollState();
  };

  initializeTabIndex = () => {
    this.syncTabToPathname(window.location.pathname);
  };

  logout = () => {
    this.props.api.logout();
  };

  hideNavDrawer = () => {
    this.props.app.hideNavDrawer();
  };

  onNavDrawerVisibilityChange = (visible: boolean) => {
    this.props.app.setNavDrawerVisibility(visible);
  };

  dismissSnackbar = () => {
    this.props.app.dismissToast();
  };

  onTabChange = (
    activeTabIndex: number,
    _tabId: IdPropType,
    _tabControlsId: IdPropType,
    _tabChildren: React.ReactNode,
    _event: Event
  ) => {
    this.setState({ activeTabIndex });
  };

  onHistoryListen = (location: Location, _action: Action) => {
    this.syncTabToPathname(location.pathname);
  };

  syncTabToPathname = (pathname: string) => {
    const index = tabInfos.findIndex((ti) => ti.path === pathname);
    this.setState({ activeTabIndex: index });
  };

  onClickApp = (_event: MouseEvent) => {
    this.props.ui.unhandledAppClick();
  };

  disableMobileSite = () => {
    this.props.app.disableMobileSite();
  };

  enableMobileSite = () => {
    this.props.app.enableMobileSite();
  };

  render() {
    const {
      authEmail,
      hasAuthToken,
      isNavDrawerVisible,
      toasts,
      isMobileSiteDisabled,
    } = this.props;
    const { activeTabIndex } = this.state;

    const navItems = [
      <ListItem
        key="home"
        primaryText="Home"
        leftIcon={<FontIcon>home</FontIcon>}
        component={Link}
        to={paths.home()}
      />,
      <ListItem
        key="createProposition"
        primaryText="Make a proposition"
        leftIcon={<FontIcon>add</FontIcon>}
        component={Link}
        to="/create-proposition"
      />,
      <ListItem
        key="tools"
        primaryText="Tools"
        leftIcon={<FontIcon>build</FontIcon>}
        component={Link}
        to={paths.tools()}
      />,
      <ListItem
        key="policies"
        primaryText="Policies"
        leftIcon={<FontIcon>gavel</FontIcon>}
        component={Link}
        to={paths.policiesOverview()}
      />,
    ];

    if (authEmail || hasAuthToken) {
      // Authenticated users can access their settings
      navItems.push(
        <ListItem
          key="Settings"
          primaryText="Settings"
          leftIcon={<FontIcon>settings</FontIcon>}
          component={Link}
          to={paths.settings()}
        />
      );
    } else {
      // Anonymous users still need access to privacy settings
      navItems.push(
        <ListItem
          key="privacySettings"
          primaryText="Privacy settings"
          leftIcon={<FontIcon>speaker_phone</FontIcon>}
          onClick={() => showPrivacyConsentDialog()}
        />
      );
    }

    if (isDevice()) {
      if (isMobileSiteDisabled) {
        navItems.push(
          <ListItem
            key="mobile-site"
            primaryText="Mobile site"
            leftIcon={<FontIcon>smartphone</FontIcon>}
            onClick={this.enableMobileSite}
          />
        );
      } else {
        navItems.push(
          <ListItem
            key="desktop-site"
            primaryText="Desktop site"
            leftIcon={<FontIcon>desktop_windows</FontIcon>}
            onClick={this.disableMobileSite}
          />
        );
      }
    }
    if (authEmail || hasAuthToken) {
      navItems.push(
        <ListItem
          key="logout"
          primaryText="Logout"
          leftIcon={<FontIcon>exit_to_app</FontIcon>}
          onClick={this.logout}
        />
      );
    } else {
      if (config.isRegistrationEnabled) {
        navItems.push(
          <ListItem
            key="register"
            primaryText="Register"
            leftIcon={<FontIcon>person_add</FontIcon>}
            component={Link}
            to={paths.requestRegistration()}
          />
        );
      }
      navItems.push(
        <ListItem
          key="login"
          primaryText="Login"
          leftIcon={<FontIcon>https</FontIcon>}
          component={Link}
          to={paths.login()}
        />
      );
    }

    const authEmailDiv = (
      <div>
        <b>{authEmail}</b>
        {hasAuthToken || (
          <div>
            <em>login expired</em>
          </div>
        )}
      </div>
    );
    const navDrawer = (
      <Drawer
        id="app-nav-drawer"
        position="right"
        type={Drawer.DrawerTypes.TEMPORARY}
        header={
          <Toolbar
            nav={
              <Button icon onClick={this.hideNavDrawer}>
                close
              </Button>
            }
            className="md-divider-border md-divider-border--bottom"
          >
            <div className="app-nav-drawer-header">
              {authEmail ? authEmailDiv : <em>Not logged in</em>}
            </div>
          </Toolbar>
        }
        navItems={navItems}
        visible={isNavDrawerVisible}
        onVisibilityChange={this.onNavDrawerVisibilityChange}
        style={{ zIndex: 100 }}
      />
    );

    const pageTabs = (
      <Tabs
        tabId="mainTab"
        centered
        className="toolbarTabs"
        activeTabIndex={activeTabIndex}
        onTabChange={this.onTabChange}
        style={{ position: "absolute", left: 0, bottom: 0, right: 0 }}
      >
        {map(tabInfos, (ti) => (
          <Tab
            label={<Link to={ti.path}>{ti.text}</Link>}
            id={ti.id}
            key={ti.id}
          />
        ))}
      </Tabs>
    ) as unknown as ComponentClass<TabsProps>;

    const title =
      isFinite(activeTabIndex) && activeTabIndex >= 0
        ? `${tabInfos[activeTabIndex].text} — Howdju`
        : "Howdju";

    const viewportContent = isMobileSiteDisabled
      ? "width=1024, initial-scale=1"
      : "width=device-width, initial-scale=1, user-scalable=no";

    return (
      <ErrorBoundary>
        <ConnectedRouter history={history}>
          <div id="app" onClick={this.onClickApp}>
            <Helmet>
              <title>{title}</title>
              <meta name="viewport" content={viewportContent} />
            </Helmet>

            <Header tabs={pageTabs} />

            {navDrawer}

            <div
              id="page"
              className={cn({
                "md-toolbar-relative": !pageTabs,
                "md-toolbar-relative--prominent": !!pageTabs,
              })}
            >
              <Switch>{routes}</Switch>
            </div>

            <div id="footer">
              Use of this site constitutes acceptance of our{" "}
              <Link to={paths.userAgreement()}>User Agreement</Link> and{" "}
              <Link to={paths.privacyPolicy()}>Privacy Policy</Link>.
            </div>

            <Snackbar toasts={toasts} onDismiss={this.dismissSnackbar} />

            <ReportContentDialog />
          </div>
        </ConnectedRouter>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  const { app } = state;
  const authEmail = selectAuthEmail(state);
  const hasAuthToken = isTruthy(selectAuthToken(state));
  const privacyConsentState = selectPrivacyConsent(state);
  const { isMobileSiteDisabled, isNavDrawerVisible, toasts } = app;

  return {
    authEmail,
    hasAuthToken,
    isNavDrawerVisible,
    toasts,
    isMobileSiteDisabled,
    privacyConsentState,
  };
};

const connector = connect(
  mapStateToProps,
  mapActionCreatorGroupToDispatchToProps({
    api,
    app,
    extension: actions.extension,
    extensionFrame: actions.extensionFrame,
    flows,
    goto,
    privacyConsent,
    ui,
  })
);

type Props = PropsFromRedux;

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(hot(App));
