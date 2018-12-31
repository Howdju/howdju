import {extension as ext} from 'howdju-client-common'

import {annotateSelection} from './annotate'
import {showSidebar, toggleSidebar} from './sidebar'
import {logger} from './logger'
import {getOption} from './options'

const didLoadKey = 'HowdjuDidLoad'

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
  getOption('howdjuBaseUrl', (baseUrl) => {
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
