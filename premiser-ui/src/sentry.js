import * as Sentry from "@sentry/browser";

export const captureMessage = (message, options) => {
  Sentry.captureMessage(message, options);
};

export const setUserContext = (sentryExternalId) => {
  Sentry.setUser({ id: sentryExternalId });
};

export const clearUserContext = () => {
  Sentry.configureScope((scope) => scope.setUser(null));
};

export const captureException = (err, extra) => {
  let data = extra ? { extra } : null;
  Sentry.captureException(err, data);
};
