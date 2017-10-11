/* globals process */
/*
 $md-grid-tablet-breakpoint: 600px !default;
 $md-grid-desktop-breakpoint: 840px !default;

 Technique to read CSS values directly from style sheets:
 https://stackoverflow.com/a/27527462/39396
 */
const config = {
  apiRoot: process.env.API_ROOT,
  isDev: process.env.NODE_ENV === 'development',
  humanDateTimeFormat: 'D MMM YYYY h:mm:ss A',
  rehydrateTimeoutMs: 5000,
  transientHideDelay: 1500,
  reduxPersistWhitelist: [
    'auth',
    'ui.isMobileSiteDisabled',
  ],
  ui: {
    statementTextMaxLength: 512,
    tagNameMaxLength: 64,
    quoteTextMaxLength: 4096,
    writTitleMaxLength: 512,

    narrowBreakpoint: 840,
    shortTextLength: 256,
    flipMove: {
      duration: 600,
      easing: "ease",
      staggerDurationBy: 15,
      staggerDelayBy: 50,
    }
  },
}

export default config