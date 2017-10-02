import isFunction from 'lodash/isFunction'

export const hide = () => {
  if (window.Smallchat) {
    // The old API was window.Smallchat.hide().  Then it started giving a deprecation warning to use window.Smallchat('hide') instead.
    // But this new API doesn't seem to have any effect...
    if (isFunction(window.Smallchat)) {
      window.Smallchat('hide')
    }
    if (window.Smallchat && window.Smallchat.hide) {
      window.Smallchat.hide()
    }
  }
}

export const show = () => {
  if (window.Smallchat) {
    if (isFunction(window.Smallchat)) {
      window.Smallchat('show')
    }
    if (window.Smallchat && window.Smallchat.show) {
      window.Smallchat.show()
    }
  }
}

export const identify = (smallchatId, shortName, longName) => {
  const sessionData = {
    name: shortName,
    longName,
    smallchatId,
  }
  window.smallchat = {sessionData}
}
