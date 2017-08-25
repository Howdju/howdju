/*
 $md-grid-tablet-breakpoint: 600px !default;
 $md-grid-desktop-breakpoint: 840px !default;

 Technique to read CSS values directly from style sheets:
 https://stackoverflow.com/a/27527462/39396
 */
const config = {
  humanDateTimeFormat: 'D MMM YYYY h:mm:ss A',
  rehydrateTimeoutMs: 5000,
  transientHideDelay: 1500,
  reduxPersistWhitelist: [
      'auth',
      'ui.isMobileSiteDisabled',
  ],
  ui: {
    narrowBreakpoint: 840,
    flipMoveDuration: 750,
    flipMoveEasing: "ease-out",
    shortTextLength: 256,
  },
}

export default config