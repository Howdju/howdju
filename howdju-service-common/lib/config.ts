import moment from "moment";

export const baseConfig = {
  authRefreshCookie: { isSecure: true },
  auth: {
    bcrypt: {
      saltRounds: 10,
    },
  },
  authTokenDuration: { hours: 2 },
  authRefreshTokenDuration: { days: 90 },
  contentReportNotificationEmails: [] as string[],
  corsAllowOrigin: [] as string[],
  /** Whether to prevent responses that indicate whether an email has been registered with the system */
  doConcealEmailExistence: false,
  // https://github.com/jsmreese/moment-duration-format#template-string
  durationFormatTemplate: "d [days] h [hours] m [minutes] s [seconds]",
  // Removes any zero values from the formatted duration.
  // https://github.com/jsmreese/moment-duration-format#trim
  durationFormatTrim: "both mid",
  /** The amount of time a user can still edit their own entities unless another user has interacted with them */
  modifyEntityGracePeriod: moment.duration({ hours: 24 }),
  passwordResetDuration: { hours: 4 },
  registrationDuration: { hours: 24 },
  uiAuthority: "https://www.howdju.com",
};
export type ApiConfig = typeof baseConfig;
