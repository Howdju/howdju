/* globals process */
/*
 $md-grid-tablet-breakpoint: 600px !default;
 $md-grid-desktop-breakpoint: 840px !default;

 Technique to read CSS values directly from style sheets:
 https://stackoverflow.com/a/27527462/39396
 */
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
  reduxPersistWhitelist: ["auth", "ui.isMobileSiteDisabled"],
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
  },
  sentryShowReportDialogThrottleMs: 5000,
  ui: {
    narrowBreakpoint: 840,
    shortTextLength: 256,
    flipMove: {
      duration: 600,
      easing: "ease",
      staggerDurationBy: 15,
      staggerDelayBy: 50,
    },
  },
  sessionStorageIdKey: "ssid",
};

export default config;
