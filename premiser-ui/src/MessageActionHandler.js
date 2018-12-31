import {logger} from './logger'

export default class MessageActionHandler {
  constructor(actionCreatorGroups) {
    this.actionCreatorGroups = actionCreatorGroups
  }

  handleAction(action) {
    const type = action.type
    switch (type) {
      case 'createJustification': {
        const {content, source, target} = action.payload
        if (!target.url.startsWith(event.origin)) {
          logger.error(`received message from ${event.origin} to createJustification of ${target.url}.` +
            ' The browser extension should only create justifications matching the current origin.  Ignoring.')
          return
        }
        if (!source.url === target.url) {
          logger.error(`received createJustification message where source.url ${source.url} doesn't match` +
            ` target.url ${target.url}.  Ignoring`)
          return
        }
        this.actionCreatorGroups.flows.beginEditOfNewJustificationFromTarget(content, source, target)
        break
      }
      default: {
        logger.error(`unsupported message action type: ${type}`)
        break
      }
    }
  }
}