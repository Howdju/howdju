import { attachHeadersListener } from 'chrome-sidebar'
import { hosts, iframeHosts } from './settings'

console.log('Howdju Sidebar Extension Registered')

chrome.browserAction.onClicked.addListener(tab => {
  console.log('Browser Action Triggered')
  chrome.tabs.executeScript(tab.id, {
    file: 'sidebar.js'
  })
})

attachHeadersListener({
  webRequest: chrome.webRequest,
  hosts,
  iframeHosts,
  overrideFrameOptions: true
})
