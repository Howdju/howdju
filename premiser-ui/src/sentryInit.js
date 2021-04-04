import assign from 'lodash/assign'
import * as Sentry from "@sentry/browser"
import { Integrations } from "@sentry/tracing"
import config from './config'

export default () => {
  Sentry.init(assign({
    integrations: [new Integrations.BrowserTracing()],
    beforeSend(event, hint) {
      // Check if it is an exception, and if so, show the report dialog
      if (event.exception) {
        Sentry.showReportDialog({eventId: event.event_id})
      }
      return event
    },
  }, config.sentry))
}
