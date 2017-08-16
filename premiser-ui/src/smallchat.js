export const hide = () => {
  window.Smallchat.hide()
}

export const show = () => {
  window.Smallchat.show()
}

export const identify = (smallchatId, shortName, fullName) => {
  const sessionData = {
    name: shortName,
    fullName,
    smallchatId,
  }
  console.log(sessionData)
  window.smallchat = {sessionData}
}
