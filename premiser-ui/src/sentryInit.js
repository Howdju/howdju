import assign from 'lodash/assign'
import * as Sentry from "@sentry/browser"
import { Integrations } from "@sentry/tracing"
import config from './config'
import {Severity} from '@sentry/types'
import {uiErrorTypes} from './uiErrors'
import {apiErrorCodes} from 'howdju-common'


export default () => {
  Sentry.init(assign({
    integrations: [new Integrations.BrowserTracing()],
    beforeSend(event, hint) {
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
    // Only prompt the user when we don't know what is going on
    Sentry.showReportDialog({eventId: event.event_id})
    event.level = Severity.Error
  } else {
    // Expected exceptions are just informational
    event.level = Severity.Info
  }

  return event
}
