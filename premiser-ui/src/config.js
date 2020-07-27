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
  isRegistrationEnabled: false,
  rehydrateTimeoutMs: 5000,
  transientHideDelay: 1500,
  authExpirationCheckFrequencyMs: 30*1000,
  reduxPersistWhitelist: [
    'auth',
    'ui.isMobileSiteDisabled',
  ],
  ui: {
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
