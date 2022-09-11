import {logger} from './logger'

/* https://docs.small.chat/javascriptapi */

let hideSmallchat = null
let showSmallchat = null

export const isVisible = () => {
  // When hidden, our Smallchat wrapper div has no children.
  const visible = !!window.document.querySelectorAll('#Smallchat *').length
  logger.info(`Smallchat is visible: ${visible}`)
  return visible
}

export const hide = () => {
  if (!window.Smallchat) {
    // Smallchat might not be loaded
    return
  }

  if (!hideSmallchat) {
    // The old API was window.Smallchat.hide().  Then it started giving a deprecation warning to use window.Smallchat('hide') instead.
    // But this new API doesn't seem to have any effect...
    if (window.Smallchat.hide) {
      hideSmallchat = window.Smallchat.hide
    }
    if (!hideSmallchat) {
      logger.error('Unable to determine hideSmallchat function.')
      return
    }
  }

  try {
    hideSmallchat()
  } catch (err) {
    logger.error('Unexpected error trying to hide Smallchat', {err})
  }
}

export const show = () => {
  if (!window.Smallchat) {
    // Smallchat might not be loaded
    return
  }

  if (!showSmallchat) {
    // The old API was window.Smallchat.hide().  Then it started giving a deprecation warning to use window.Smallchat('hide') instead.
    // But this new API doesn't seem to have any effect...
    if (window.Smallchat.hide) {
      showSmallchat = window.Smallchat.show
    }
    if (!showSmallchat) {
      logger.error('Unable to determine hideSmallchat function.')
      return
    }
  }

  try {
    showSmallchat()
  } catch (err) {
    logger.error('Unexpected error trying to show Smallchat', {err})
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

export const unidentify = () => {
  window.smallchat = {}
}
