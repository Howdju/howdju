import { ConnectedRouter } from "connected-react-router";
import { Action, Location, UnregisterCallback } from "history";
import forEach from "lodash/forEach";
import isFinite from "lodash/isFinite";
import map from "lodash/map";
import throttle from "lodash/throttle";
import React, { Component, MouseEvent } from "react";
import { hot } from "react-hot-loader/root";
import { TabsList, Tab } from "@react-md/tabs";
import { connect, ConnectedProps } from "react-redux";
import { Switch } from "react-router";
import { Link } from "react-router-dom";
import { FontIcon, SVGIcon } from "@react-md/icon";
import { Sheet } from "@react-md/sheet";
import { List } from "@react-md/list";
import { MessageQueue } from "@react-md/alert";

import { actions, inIframe } from "howdju-client-common";
import { isTruthy } from "howdju-common";

import app from "@/app/appSlice";
import {
  api,
  flows,
  goto,
  mapActionCreatorGroupToDispatchToProps,
  privacyConsent,
  ui,
} from "./actions";
import IconButton from "./components/button/IconButton";
import MediaExcerptApparitionsDialog from "./components/mediaExcerptApparitionsDialog/MediaExcerptApparitionsDialog";
import PropositionAppearancesDialog from "./components/propositionAppearancesDialog/PropositionAppearancesDialog";
import config from "./config";
import ReportContentDialog from "./content-report/ReportContentDialog";
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
import ErrorBoundary from "./ErrorBoundary";
import Header from "./Header";
import Helmet from "./Helmet";
import { history } from "./history";
import { logger } from "./logger";
import paths from "./paths";
import routes from "./routes";
import {
  selectAuthEmail,
  selectAuthToken,
  selectPrivacyConsent,
} from "./selectors";
import sentryInit from "./sentryInit";
import { RootState } from "./setupStore";
import { startPersisting, stopPersisting } from "./store";
import t, {
  MAIN_TABS_ABOUT_TAB_NAME,
  MAIN_TABS_RECENT_ACTIVITY_TAB_NAME,
} from "./texts";
import { isDevice, isScrollPastBottom, isScrollPastTop } from "./util";
import WindowMessageHandler from "./WindowMessageHandler";
import { MenuItem, MenuItemLink } from "@/components/menu/Menu";
import { AddMessageCapturer } from "./AddMessageCapturer";

import "./App.scss";
import "./fonts.js";
import { MaterialSymbol } from "react-material-symbols";

const tabInfos = [
  {
    path: paths.home(),
    text: "Home",
    id: "landing-tab",
  },
  {
    path: paths.recentActivity(),
    text: t(MAIN_TABS_RECENT_ACTIVITY_TAB_NAME),
    id: "recent-activity-tab",
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
      beginEditOfMediaExcerptFromInfo:
        this.props.flows.beginEditOfMediaExcerptFromInfo,
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

  onNavSheetRequestClose = () => {
    this.props.app.setNavDrawerVisibility(false);
  };

  onTabChange = (activeIndexNumber: number) => {
    this.setState({ activeTabIndex: activeIndexNumber });
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
      isMobileSiteDisabled,
    } = this.props;
    const { activeTabIndex } = this.state;

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
    const navItems = [
      <MenuItem
        key="login-status"
        primaryText={authEmail ? authEmailDiv : <em>Not logged in</em>}
        leftAddon={
          <IconButton
            id="close-app-nav-drawer-button"
            aria-label="Close Nav Drawer"
            onClick={this.hideNavDrawer}
          >
            <FontIcon>close</FontIcon>
          </IconButton>
        }
      />,
      <MenuItemLink
        key="home"
        primaryText="Home"
        leftAddon={<FontIcon>home</FontIcon>}
        component={Link}
        to={paths.home()}
      />,
      <MenuItemLink
        key="createProposition"
        primaryText="Make a proposition"
        leftAddon={<FontIcon>add</FontIcon>}
        component={Link}
        to="/create-proposition"
      />,
      <MenuItemLink
        key="createMediaExcerpt"
        primaryText="Make an excerpt"
        leftAddon={<FontIcon>format_quote</FontIcon>}
        component={Link}
        to="/media-excerpts/new"
      />,
      <MenuItemLink
        key="documentationSite"
        primaryText="Docs site"
        leftAddon={<MaterialSymbol icon="menu_book" />}
        component="a"
        href="https://docs.howdju.com"
        target="_blank"
      />,
      <MenuItemLink
        key="tools"
        primaryText="Chrome Extension"
        leftAddon={<FontIcon>build</FontIcon>}
        component="a"
        href="https://chrome.google.com/webstore/detail/howdju-extension/gijlmlebhfiglpgdlgphbmaamhkchoei/"
        target="_blank"
      />,
      <MenuItemLink
        key="policies"
        primaryText="Policies"
        leftAddon={<FontIcon>gavel</FontIcon>}
        component="a"
        href={paths.policies()}
        target="_blank"
      />,
    ];

    if (authEmail || hasAuthToken) {
      // Authenticated users can access their settings
      navItems.push(
        <MenuItemLink
          key="Settings"
          primaryText="Settings"
          leftAddon={<FontIcon>settings</FontIcon>}
          component={Link}
          to={paths.settings()}
        />
      );
    } else {
      // Anonymous users still need access to privacy settings
      navItems.push(
        <MenuItem
          key="privacySettings"
          primaryText="Privacy settings"
          leftAddon={<FontIcon>speaker_phone</FontIcon>}
          onClick={() => showPrivacyConsentDialog()}
        />
      );
    }

    if (isDevice()) {
      if (isMobileSiteDisabled) {
        navItems.push(
          <MenuItem
            key="mobile-site"
            primaryText="Mobile site"
            leftAddon={<FontIcon>smartphone</FontIcon>}
            onClick={this.enableMobileSite}
          />
        );
      } else {
        navItems.push(
          <MenuItem
            key="desktop-site"
            primaryText="Desktop site"
            leftAddon={<FontIcon>desktop_windows</FontIcon>}
            onClick={this.disableMobileSite}
          />
        );
      }
    }
    if (authEmail || hasAuthToken) {
      navItems.push(
        <MenuItem
          key="logout"
          primaryText="Logout"
          leftAddon={<FontIcon>exit_to_app</FontIcon>}
          onClick={this.logout}
        />
      );
    } else {
      if (config.isRegistrationEnabled) {
        navItems.push(
          <MenuItemLink
            key="register"
            primaryText="Register"
            leftAddon={<FontIcon>person_add</FontIcon>}
            component={Link}
            to={paths.requestRegistration()}
          />
        );
      }
      navItems.push(
        <MenuItemLink
          key="login"
          primaryText="Login"
          leftAddon={<FontIcon>https</FontIcon>}
          component={Link}
          to={paths.login()}
        />
      );
    }
    const navDrawer = (
      <Sheet
        id="app-nav-drawer"
        aria-label="Howdju App Navigation Sheet"
        position="right"
        visible={isNavDrawerVisible}
        onRequestClose={this.onNavSheetRequestClose}
      >
        <List onClick={this.hideNavDrawer}>{navItems}</List>
      </Sheet>
    );

    const newTabs = (
      <TabsList
        className="toolbarTabs"
        align="center"
        activeIndex={activeTabIndex}
        onActiveIndexChange={() => {
          /* noop because onActiveIndexChange is required. We call onTabChange below, though. */
        }}
      >
        {map(tabInfos, (ti, i) => (
          // Link must be outer element to reliably capture clicks
          <Link to={ti.path} key={ti.id} onClick={() => this.onTabChange(i)}>
            <Tab active={i === activeTabIndex} id={ti.id} tabIndex={i}>
              {ti.text}
            </Tab>
          </Link>
        ))}
      </TabsList>
    );

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
          <MessageQueue id="toast-message-queue">
            <div id="app" onClick={this.onClickApp}>
              <Helmet>
                <title>{title}</title>
                <meta name="viewport" content={viewportContent} />
              </Helmet>

              <Header />
              {newTabs}

              {navDrawer}

              <div id="page">
                <Switch>{routes}</Switch>
              </div>

              <div id="footer">
                Use of this site constitutes acceptance of our{" "}
                <Link to={paths.userAgreement()}>User Agreement</Link> and{" "}
                <Link to={paths.privacyPolicy()}>Privacy Policy</Link>.
                <div id="footer-links">
                  <a href="https://www.github.com/Howdju/howdju" title="Github">
                    <SVGIcon aria-label="Github">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </SVGIcon>
                  </a>
                  <a href="https://docs.howdju.com" title="Documentation">
                    <MaterialSymbol icon="menu_book" size={24} />
                  </a>
                </div>
              </div>

              <AddMessageCapturer />
              <ReportContentDialog />
              <PropositionAppearancesDialog />
              <MediaExcerptApparitionsDialog />
            </div>
          </MessageQueue>
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
  const { isMobileSiteDisabled, isNavDrawerVisible } = app;

  return {
    authEmail,
    hasAuthToken,
    isNavDrawerVisible,
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
