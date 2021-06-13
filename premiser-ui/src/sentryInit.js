import assign from 'lodash/assign'
import throttle from 'lodash/throttle'
import * as Sentry from "@sentry/browser"
import { Integrations } from "@sentry/tracing"
import {Severity} from '@sentry/types'

import {apiErrorCodes} from 'howdju-common'

import config from './config'
import {uiErrorTypes} from './uiErrors'
import {cookieConsent, ERROR_REPORTING, FULL_ERROR_REPORTING} from './cookieConsent'


export default () => {
  const integrations = []
  if (cookieConsent.isAccepted(FULL_ERROR_REPORTING)) {
    integrations.push(new Integrations.BrowserTracing())
  }
  Sentry.init(assign({
    integrations,
    beforeSend(event, hint) {
      if (!cookieConsent.isAccepted(ERROR_REPORTING)) return null
      if (event.exception) {
        event = handleExceptionEvent(event, hint)
      }
      return event
    },
  }, config.sentry))
}

function handleExceptionEvent(event, hint) {
  let isUnexpectedError = true

  switch(hint.originalException.errorType) {
    // UI error types that we don't even want to report
    case uiErrorTypes.COMMIT_EDIT_RESULT_ERROR:
      return null
    case uiErrorTypes.API_RESPONSE_ERROR:
      isUnexpectedError = hint.originalException.body.errorCode === apiErrorCodes.UNEXPECTED_ERROR
  }

  if (isUnexpectedError) {
    // Only prompt the user when we don't know what is going on, and only prompte them occassionally
    // (E.g., if all fetches on a page fail, we don't want to show them the dialog for each failure.)
    throttledShowReportDialog({eventId: event.event_id})
    event.level = Severity.Error
  } else {
    // Expected exceptions are just informational
    event.level = Severity.Info
  }

  return event
}

function showReportDialog(options) {
  Sentry.showReportDialog(options)
}

const throttledShowReportDialog = throttle(showReportDialog, config.sentryShowReportDialogThrottleMs)
