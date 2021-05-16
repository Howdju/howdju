import {logger} from './logger'
import {EXTENSION_MESSAGE_SOURCE, actions, inIframe} from "howdju-client-common"


export default class WindowMessageHandler {
  constructor(actionCreatorGroups) {
    this.actionCreatorGroups = actionCreatorGroups
    if (inIframe()) {
      this.actionCreatorGroups.extension.messageHandlerReady()
    }
  }

  handleEvent(event) {
    // Howdju would be loaded in an iframe of the content script's window when loaded by the extension
    if (event.source !== window.parent) {
      return
    }
    const source = event.data.source
    if (source !== EXTENSION_MESSAGE_SOURCE) {
      logger.debug(`ignoring message event with incorrect source: ${source}`)
      return
    }
    const action = event.data.action
    if (!action) {
      logger.error(`extension message lacked action`, event.data)
      return
    }
    this.handleAction(event.origin, action)
  }

  handleAction(eventOrigin, action) {
    const type = action.type
    switch (type) {
      case actions.str(actions.extensionFrame.createJustification): {
        const {content, source, target} = action.payload
        if (!target.url.startsWith(eventOrigin)) {
          logger.error(`received message from ${eventOrigin} to createJustification of ${target.url}.` +
            ' The browser extension should only create justifications matching the current origin.  Ignoring.')
          return
        }
        if (source.url !== target.url) {
          logger.error(`received createJustification message where source.url ${source.url} doesn't match` +
            ` target.url ${target.url}.  Ignoring`)
          return
        }
        this.actionCreatorGroups.flows.beginEditOfNewJustificationFromTarget(content, source, target)
        break
      }
      case actions.str(actions.extensionFrame.gotoJustification): {
        logger.trace(`extensionFrame.gotoJustification`, {action})
        const {justification} = action.payload
        this.actionCreatorGroups.goto.justification(justification)
        break
      }
      case actions.str(actions.extensionFrame.ackMessage): {
        this.actionCreatorGroups.extensionFrame.ackMessage()
        break
      }
      default: {
        logger.error(`unsupported message action type: ${type}`)
        break
      }
    }
  }
}
