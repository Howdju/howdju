// https://docs.sentry.io/clients/javascript/tips/

// https://docs.sentry.io/clients/javascript/usage/#raven-js-reporting-errors
export const captureMessage = (message, options) => Raven.captureMessage(message, options)

export const setUserContext = sentryExternalId => Raven.setUserContext({
  id: sentryExternalId
})

export const clearUserContext = () => Raven.setUserContext()

export const captureException = (ex, context) => Raven.captureException(ex, {
  extra: context
})

export const showReportDialog = () => Raven.showReportDialog()