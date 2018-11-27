import {annotateSelection} from './annotate'
import {showSidebar, toggleSidebar} from './sidebar'
import {logger} from './logger'
import ext from './extension'

const didLoadKey = 'HowdjuDidLoad'
// TODO this should match the expected scheme/host/port of the iframe
// const sidebarTargetOrigin = '*'
const sidebarTargetOrigin = 'http://localhost:3000'

if (!window[didLoadKey]) {
  ext.runtime.onMessage.addListener(onMessage)
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
    case 'annotate':
      annotateAndEdit()
      break
    case 'toggleSidebar':
      toggleSidebar()
      break
    default:
      logger.log('Unknown request:', request)
      break
  }
}

function annotateAndEdit() {
  const annotation = annotateSelection()
  showSidebar(({frame}) => {
    frame.contentWindow.postMessage({
      source: 'extension',
      action: {
        type: 'createJustification',
        payload: {
          content: annotation.getContent(),
          source: new Source(),
          target: annotation.target,
        }
      },
    }, sidebarTargetOrigin)
  })
}

class Source {
  constructor() {
    this.url = window.location.href
    this.title = document.title
  }
}
