import {extension as ext, actions, logger} from 'howdju-client-common'

import {attachHeadersListener} from './attach'
import {getOptions} from './options'

ext.addBrowserActionOnClickedListener(tab => {
  sendMessage(tab, {action: "toggleSidebar"})
})

ext.addRuntimeOnInstalledListener(onInstalled)

ext.addRuntimeOnMessageExternalListener(
  function(request, sender, sendResponse) {
    if (request.type === actions.str(actions.extension.focusJustificationOnUrl)) {
      // watch for request.payload.url.  If it loads in the next 10s, toggle the sidebar pointed at request.payload.howdjuUrl
    }
  }
)

function onInstalled() {
  ext.contextMenusCreate({
    id: 'howdju-context-menu-annotate',
    title: '+ Howdju',
    contexts: ['selection'],
    onclick: sendAnnotateMessage,
  }, logLastError)
}

// chrome.contextMenus.onClicked.addListener(onContextMenuClicked)

function sendMessage(tab, message) {
  // TODO can we avoid loading the script and css on every message?
  ext.tabsExecuteScript(tab.id, {
    file: 'content.js'
  }, () => {
    ext.tabsSendMessage(tab.id, message)
  })
  ext.tabsInsertCSS(tab.id, {
    file: 'content.css'
  })
}

function sendAnnotateMessage(info, tab) {
  sendMessage(tab, {action: "annotate"})
}

function logLastError() {
  if (ext.hasLastError()) {
    logger.error("Last error: " + ext.lastErrorMessage())
  }
}

getOptions(['howdjuBaseUrl', 'isDevelopment'], ({howdjuBaseUrl, isDevelopment}) => {
  attachHeadersListener({
    ext,
    hosts: howdjuBaseUrl,
    iframeHosts: howdjuBaseUrl,
    overrideFrameOptions: true,
    isDevelopment,
  })
})
