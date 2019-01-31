import isNode from 'detect-node'

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

// We run the tests in node, so there likely will not be an extension api then
if (!extension && !isNode) {
  throw new Error("unable to detect extension API")
}

export default extension
