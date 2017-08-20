// https://docs.sentry.io/clients/javascript/tips/

// https://docs.sentry.io/clients/javascript/usage/#raven-js-reporting-errors
export const captureMessage = (message, options) => {
  if (window.Raven) {
    window.Raven.captureMessage(message, options)
  }
}

export const setUserContext = sentryExternalId => {
  if (window.Raven) {
    window.Raven.setUserContext({
      id: sentryExternalId,
    })
  }
}

export const clearUserContext = () => {
  if (window.Raven) {
    window.Raven.setUserContext()
  }
}

export const captureException = (ex, extra) => {
  if (window.Raven) {
    let data = extra ? {extra} : null
    window.Raven.captureException(ex, data)
  }
}

export const showReportDialog = () => {
  if (window.Raven) {
    window.Raven.showReportDialog()
  }
}