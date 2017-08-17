export const hide = () => {
  window.Smallchat.hide()
}

export const show = () => {
  window.Smallchat.show()
}

export const identify = (smallchatId, shortName, longName) => {
  const sessionData = {
    name: shortName,
    longName,
    smallchatId,
  }
  window.smallchat = {sessionData}
}
