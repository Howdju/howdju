/*global chrome:false*/

import {annotateSelection} from './annotation'
import {toggleSidebar} from './sidebar'
import {logger} from './logger'

const didLoad = 'HowdjuDidLoad'

if (!window[didLoad]) {
  chrome.runtime.onMessage.addListener(onMessage)
  window[didLoad] = true
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
      annotateSelection()
      break
    case 'toggleSidebar':
      toggleSidebar()
      break
    default:
      console.log('Unknown request:', request)
      break
  }
}