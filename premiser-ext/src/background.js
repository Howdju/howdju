// Babel runtime dependencies
import "core-js/stable"
import "regenerator-runtime/runtime"

import {logger} from 'howdju-common'
import {extension as ext} from 'howdju-client-common'

import {attachHeadersListener} from './attach'
import {getOptions} from './options'
import {toggleSidebar, annotateSelection, RUN_COMMANDS_WHEN_TAB_RELOADED, runCommands} from "./messages"

let tabReloadCommands = null

ext.addBrowserActionOnClickedListener(onBrowserActionClicked)
ext.addRuntimeOnInstalledListener(onInstalled)
ext.addRuntimeOnMessageListener(onRuntimeMessage)
ext.addWebNavigationOnDOMContentLoadedListener(onDOMContentLoaded)

getOptions(['howdjuBaseUrl', 'isDevelopment'], ({howdjuBaseUrl, isDevelopment}) => {
  attachHeadersListener({
    ext,
    hosts: howdjuBaseUrl,
    iframeHosts: howdjuBaseUrl,
    overrideFrameOptions: true,
    isDevelopment,
  })
})

function onInstalled() {
  createContextMenus()
}

function createContextMenus() {
  ext.createContextMenus({
    id: 'howdju-context-menu-annotate',
    title: '+ Howdju',
    contexts: ['selection'],
    onclick: sendAnnotateSelectionMessage,
  }, logLastError)
}

function onRuntimeMessage(message, sender, callback) {
  const {type} = message
  switch (type) {
    case RUN_COMMANDS_WHEN_TAB_RELOADED:
      tabReloadCommands = {
        tabId: sender.tab.id,
        commands: message.payload.commands,
      }
      break
  }

  if (callback) callback()
}

function onDOMContentLoaded(details) {
  const {tabId} = details
  if (tabReloadCommands && tabId === tabReloadCommands.tabId) {
    // sendShowSidebarMessage(tabId)
    sendRunCommandsMessage(tabId, tabReloadCommands.commands)
    tabReloadCommands = null
  }
}

function onBrowserActionClicked(tab) {
  sendToggleSidebarMessage(tab.id)
}

function sendToggleSidebarMessage(tabId) {
  sendMessage(tabId, toggleSidebar())
}

function sendRunCommandsMessage(tabId, commands) {
  sendMessage(tabId, runCommands(commands))
}

// chrome.contextMenus.onClicked.addListener(onContextMenuClicked)

function sendMessage(tabId, message) {
  // TODO can we avoid loading the script and css on every message?
  ext.executeScript(tabId, {
    file: 'content.js'
  }, () => {
    ext.sendTabMessage(tabId, message)
  })
  ext.insertCSS(tabId, {
    file: 'content.css'
  })
}

function sendAnnotateSelectionMessage(info, tab) {
  sendMessage(tab.id, annotateSelection())
}

function logLastError() {
  if (ext.hasLastError()) {
    logger.error("Last error: " + ext.getLastErrorMessage())
  }
}
