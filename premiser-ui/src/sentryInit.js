import assign from 'lodash/assign'
import * as Sentry from "@sentry/browser"
import { Integrations } from "@sentry/tracing"
import config from './config'
import some from 'lodash/some'
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
  let isUnexpectedError = false

  // We should always handle errors. So if the error was unhandled, that's unexpected
  if (some(event.exception.values, ex => !ex.mechanism.handled)) {
    isUnexpectedError = true
  }

  switch(hint.originalException.errorType) {
    // UI error types that we don't even want to report
    case uiErrorTypes.COMMIT_EDIT_RESULT_ERROR:
      return null
    case uiErrorTypes.API_RESPONSE_ERROR:
      switch(hint.originalException.body.errorCode) {
        // Most API errors are expected
        case apiErrorCodes.UNEXPECTED_ERROR:
          isUnexpectedError = true
      }
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