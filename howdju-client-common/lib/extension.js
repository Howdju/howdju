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

let extension
if (window.chrome) {
  extension = window.chrome
} else if (window.browser) {
  extension = window.browser
}

class Extension {
  constructor(extension) {
    this.extension = extension
  }

  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#Communicating_with_the_web_page
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions
  sendMessage(extensionId, action) {
    if (extension) {
      this.extension.runtime.sendMessage(extensionId, action)
    }
  }
}

export default new Extension(extension)
