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
  sendMessage = (extensionId, action) => {
    if (this.extension) {
      this.extension.runtime.sendMessage(extensionId, action)
    }
  }

  addRuntimeOnMessageListener = (listener) => {
    if (this.extension) {
      this.extension.runtime.onMessage.addListener(listener)
    }
  }

  addRuntimeOnInstalledListener = (listener) => {
    if (this.extension) {
      this.extension.runtime.onInstalled.addListener(listener)
    }
  }

  addRuntimeOnMessageExternalListener = (listener) => {
    if (this.extension) {
      this.extension.runtime.onMessageExternal.addListener
    }
  }

  addBrowserActionOnClickedListener = (listener) => {
    if (this.extension) {
      this.extension.browserAction.onClicked.addListener(listener)
    }
  }

  contextMenusCreate = (options, logLastError) => {
    if (this.extension) {
      this.extension.contextMenus.create(options, logLastError)
    }
  }

  tabsExecuteScript = (tabId, details, callback) => {
    if (this.extension) {
      this.extension.tabs.executeScript(tabId, details, callback)
    }
  }

  tabsInsertCSS = (tabId, details) => {
    if (this.extension) {
      this.extension.tabs.insertCSS(tabId, details)
    }
  }

  tabsSendMessage = (tabId, message) => {
    if (this.extension) {
      this.extension.tabs.sendMessage(tabId, message)
    }
  }

  hasLastError = () => {
    return !!this.extension && this.extension.extension.lastError
  }

  lastErrorMessage = () => {
    if (this.extension) {
      this.extension.extension.lastError.message
    }
  }

  addWebRequestOnHeadersReceivedListener = (listener, filter, extraInfoSpec) => {
    if (this.extension) {
      this.extension.webRequest.onHeadersReceived.addListener(listener, filter, extraInfoSpec)
    }
  }

  storageLocalSet = (details, callback) => {
    if (this.extension) {
      this.extension.storage.local.set(details, callback)
    }
  }

  storageLocalGet = (keys, callback) => {
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
