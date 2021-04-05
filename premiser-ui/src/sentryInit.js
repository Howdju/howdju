import assign from 'lodash/assign'
import * as Sentry from "@sentry/browser"
import { Integrations } from "@sentry/tracing"
import config from './config'
import some from 'lodash/some'
import {Severity} from '@sentry/types'

export default () => {
  Sentry.init(assign({
    integrations: [new Integrations.BrowserTracing()],
    beforeSend(event, hint) {
      if (event.exception) {
        if (some(event.exception.values, ex => !ex.mechanism.handled)) {
          // Ask the user what happened for unhandled exceptions
          Sentry.showReportDialog({eventId: event.event_id})
        } else {
          // handled exceptions are not errors
          event.level = Severity.Info
        }
      }
      return event
    },
  }, config.sentry))
}
