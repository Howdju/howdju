// https://docs.heapanalytics.com/v1.0/reference

export const track = (eventName, label, value) => {
  if (window.heap) {
    const properties = {}
    if (label) {
      properties.label = label
    }
    if (value) {
      properties.value = value
    }
    window.heap.track(eventName, properties)
  }
}

export const identify = id => {
  if (window.heap) {
    window.heap.identify(id)
  }
}


export const resetIdentity = () => {
  if (window.heap) {
    window.heap.resetIdentity()
  }
}
