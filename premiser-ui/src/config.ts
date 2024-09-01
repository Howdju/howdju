/* globals process */

const config = {
  apiRoot: process.env.API_ROOT,
  apiTimeoutMs: 10_000,
  humanDateTimeFormat: "D MMM YYYY h:mm:ss A Z",
  isDev: process.env.NODE_ENV === "development",
  contentScriptAckDelayMs: 200,
  contentScriptAckTimeoutMs: 1000,
  isRegistrationEnabled: true,
  rehydrateTimeoutMs: 5000,
  commitEditThenViewResponseTimeoutMs: 5000,
  transientHideDelay: 1500,
  authExpirationCheckFrequencyMs: 30 * 1000,
  redux: {
    persistLetList: ["currentUser", "ui.isMobileSiteDisabled"],
    ignoredActionPaths: [
      // The normalization schemas are convenient to have, but non-serializable. We could also
      // include a string identifier/descriptor of the normalization schema and look it up
      // when we need it.
      // TODO(#154) remove these ignores
      "payload.normalizationSchema",
      "meta.normalizationSchema",
      "payload.itemFactory",
      // TODO(#472) remove once we remove error-logging Saga.
      "errors.loggedErrors",
      /payload\.apiAction\.payload\.normalizationSchema\.*/,
      /payload\.meta\.normalizationSchema\.[^.]+/,
      "payload.mediaExcerpt.created",
      /payload\.mediaExcerpt\.locators\.urlLocators\.\d+\.created/,
      /payload\.mediaExcerpt\.locators\.urlLocators\.\d+\.autoConfirmationStatus\.(earliest|latest)(Not)?FoundAt/,
      "payload.urlLocator.created",
      /payload\.urlLocator\.autoConfirmationStatus\.(earliest|latest)(Not)?FoundAt/,
      "payload.reactMdAddMessage",
    ],
    ignoredPaths: [
      // TODO(#484) figure out how to handle timestamps in a way that is acceptable to redux.
      /entities\.mediaExcerpts\.[^.]+\.created/,
      /entities\.mediaExcerptCitations\.[^.]+\.created/,
      /entities\.mediaExcerptSpeakers\.[^.]+\.created/,
      /entities\.urlLocators\.[^.]+\.created/,
      /entities\.urlLocators.[^.]+\.autoConfirmationStatus\.(earliest|latest)(Not)?FoundAt/,
    ],
  },
  reduxDevtoolsExtension: {
    doTrace: true,
    traceLimit: 25,
  },
  sentry: {
    enabled: !!process.env.SENTRY_ENABLED,
    dsn: "https://05b15a6447f3427db2f4977950149202@o92193.ingest.sentry.io/200909",
    release: `web-ui@${process.env.PACKAGE_VERSION} (${process.env.GIT_COMMIT_HASH_SHORT})`,
    environment: process.env.SENTRY_ENV,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      // TODO(#533) remove this exception
      "ResizeObserver loop completed with undelivered notifications",
    ],
  },
  sentryShowReportDialogThrottleMs: 5000,
  ui: {
    // react-md's desktop breakpoint is 840px
    narrowBreakpoint: 840,
    shortTextLength: 256,
    flipMove:
      // Disable FLIP animations in tests
      process.env.NODE_ENV === "test"
        ? { duration: 0 }
        : {
            duration: 600,
            easing: "ease",
            staggerDurationBy: 15,
            staggerDelayBy: 50,
          },
  },
  sessionStorageIdKey: "ssid",
};

export default config;
