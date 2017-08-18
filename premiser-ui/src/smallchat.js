export const hide = () => {
  if (window.Smallchat) {
    window.Smallchat.hide()
  }
}

export const show = () => {
  if (window.Smallchat) {
    window.Smallchat.show()
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
