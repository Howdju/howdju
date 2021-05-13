import {extension as ext} from 'howdju-client-common'

import {annotateSelection} from './annotate'
import {showSidebar, toggleSidebar} from './sidebar'
import {logger, EXTENSION_MESSAGE_SOURCE} from 'howdju-client-common'
import {getOption} from './options'
import {ANNOTATE, TOGGLE_SIDEBAR} from "./messages"

import {actions} from 'howdju-client-common'

const didLoadKey = 'HowdjuDidLoad'

if (!window[didLoadKey]) {
  ext.addRuntimeOnMessageListener(onMessage)
  window[didLoadKey] = true
}

function onMessage(request, sender, sendResponse) {
  try {
    routeMessage(request, sender)
  } catch (err) {
    logger.error(err)
  }
  if (sendResponse) sendResponse()
}

function routeMessage(request, sender) {
  logger.debug('request:', request, sender)
  switch (request.action) {
    case ANNOTATE:
      annotateAndEdit()
      break
    case TOGGLE_SIDEBAR:
      toggleSidebar()
      break
    default:
      logger.log('Request for unrecognized action:', request)
      break
  }
}

function annotateAndEdit() {
  const annotation = annotateSelection()
  getOption('howdjuBaseUrl', (baseUrl) => {
    showSidebar(({frame}) => {
      frame.contentWindow.postMessage({
        source: EXTENSION_MESSAGE_SOURCE,
        action: actions.extensionFrame.createJustification({
          content: annotation.getContent(),
          source: new Source(),
          target: annotation.target,
        }),
      }, baseUrl)
    })
  })
}

class Source {
  constructor() {
    this.url = window.location.href
    this.title = document.title
  }
}
