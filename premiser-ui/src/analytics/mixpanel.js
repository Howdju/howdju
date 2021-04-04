/* https://mixpanel.com/help/reference/javascript */

export const track = (eventName, label, value) => {
  if (window.mixpanel) {
    const properties = {}
    if (label) {
      properties.label = label
    }
    if (value) {
      properties.value = value
    }
    window.mixpanel.track(eventName, properties)
  }
}

export const identify = id => {
  if (window.mixpanel) {
    window.mixpanel.identify(id)
  }
}

export const reset = () => {
  if (window.mixpanel) {
    window.mixpanel.reset()
  }
}
