import {extension as ext, actions} from 'howdju-client-common'

import {attachHeadersListener} from './attach'
import {logger} from './logger'
import {getOptions} from './options'

ext.browserAction.onClicked.addListener(tab => {
  sendMessage(tab, {action: "toggleSidebar"})
})

ext.runtime.onInstalled.addListener(onInstalled)

ext.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.type === actions.str(actions.extension.focusJustificationOnUrl)) {
      // watch for request.payload.url.  If it loads in the next 10s, toggle the sidebar pointed at request.payload.howdjuUrl
    }
  }
)

function onInstalled() {
  ext.contextMenus.create({
    id: 'howdju-context-menu-annotate',
    title: '+ Howdju',
    contexts: ['selection'],
    onclick: sendAnnotateMessage,
  }, logLastError)
}

// chrome.contextMenus.onClicked.addListener(onContextMenuClicked)

function sendMessage(tab, message) {
  // TODO can we avoid loading the script and css on every message?
  ext.tabs.executeScript(tab.id, {
    file: 'content.js'
  }, () => {
    ext.tabs.sendMessage(tab.id, message)
  })
  ext.tabs.insertCSS(tab.id, {
    file: 'content.css'
  })
}

function sendAnnotateMessage(info, tab) {
  sendMessage(tab, {action: "annotate"})
}

function logLastError() {
  if (ext.extension.lastError) {
    logger.error("Last error: " + ext.extension.lastError.message)
  }
}

getOptions(['howdjuBaseUrl', 'isDevelopment'], ({howdjuBaseUrl, isDevelopment}) => {
  attachHeadersListener({
    webRequest: ext.webRequest,
    hosts: howdjuBaseUrl,
    iframeHosts: howdjuBaseUrl,
    overrideFrameOptions: true,
    isDevelopment,
  })
})
