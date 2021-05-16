import {logger} from './logger'

// const apis = [
//   'alarms',
//   'bookmarks',
//   'browserAction',
//   'commands',
//   'contextMenus',
//   'cookies',
//   'downloads',
//   'events',
//   'extension',
//   'extensionTypes',
//   'history',
//   'i18n',
//   'idle',
//   'notifications',
//   'pageAction',
//   'runtime',
//   'storage',
//   'tabs',
//   'webNavigation',
//   'webRequest',
//   'windows',
// ]

class Extension {
  constructor(extension) {
    this.extension = extension
  }

  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#Communicating_with_the_web_page
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions
  sendRuntimeMessage = (message, callback) => {
    if (this.extension) {
      this.extension.runtime.sendMessage(message, callback)
    }
  }

  createTab = (details) => {
    if (this.extension) {
      this.extension.tabs.create(details);
    }
  }

  queryTabs = (details, callback) => {
    if (this.extension) {
      this.extension.tabs.query(details, callback)
    }
  }

  sendTabMessage = (tabId, message, callback) => {
    if (this.extension) {
      this.extension.tabs.sendMessage(tabId, message, callback);
    }
  }

  addRuntimeOnMessageListener = (listener) => {
    if (this.extension) {
      this.extension.runtime.onMessage.addListener(listener)
    }
  }

  addWebNavigationOnDOMContentLoadedListener = (listener) => {
    if (this.extension) {
      this.extension.webNavigation.onDOMContentLoaded.addListener(listener)
    }
  }

  addRuntimeOnInstalledListener = (listener) => {
    if (this.extension) {
      this.extension.runtime.onInstalled.addListener(listener)
    }
  }

  addBrowserActionOnClickedListener = (listener) => {
    if (this.extension) {
      this.extension.browserAction.onClicked.addListener(listener)
    }
  }

  createContextMenus = (options, logLastError) => {
    if (this.extension) {
      this.extension.contextMenus.create(options, logLastError)
    }
  }

  executeScript = (tabId, details, callback) => {
    if (this.extension) {
      this.extension.tabs.executeScript(tabId, details, callback)
    }
  }

  insertCSS = (tabId, details) => {
    if (this.extension) {
      this.extension.tabs.insertCSS(tabId, details)
    }
  }

  hasLastError = () => {
    return !!this.extension && this.extension.extension.lastError
  }

  getLastErrorMessage = () => {
    if (this.extension) {
      this.extension.extension.lastError.message
    }
  }

  addWebRequestOnHeadersReceivedListener = (listener, filter, extraInfoSpec) => {
    if (this.extension) {
      this.extension.webRequest.onHeadersReceived.addListener(listener, filter, extraInfoSpec)
    }
  }

  setStorageLocal = (details, callback) => {
    if (this.extension) {
      this.extension.storage.local.set(details, callback)
    }
  }

  getStorageLocal = (keys, callback) => {
    if (this.extension) {
      this.extension.storage.local.get(keys, callback)
    }
  }

  getStorage = (storageArea, keys, callback) => {
    if (this.extension) {
      this.extension.storage[storageArea].get(keys, callback)
    }
  }
}

let extension
if (window.chrome) {
  extension = new Extension(window.chrome)
} else if (window.browser) {
  extension = new Extension(window.browser)
} else {
  logger.warn("Unsupported extension environment.")
  extension = new Extension()
}

export {extension}
