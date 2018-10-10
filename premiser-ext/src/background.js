import ext from './extension'
import {logger} from './logger'

ext.browserAction.onClicked.addListener(tab => {
  sendMessage(tab, {action: "toggleSidebar"})
})

ext.runtime.onInstalled.addListener(onInstalled)

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
    logger.error("Last error: " + ext.extension.lastError.message);
  }
}
