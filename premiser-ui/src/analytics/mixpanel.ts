/* https://mixpanel.com/help/reference/javascript */


declare global {
  interface Window {
    mixpanel?: {
      track(eventName: string, properties: Properties): void
      identify(id: string): void
      reset(): void
    }
  }
}

interface Properties {
  label?: string
  value?: string
}

export const track = (eventName: string, label?: string, value?: string) => {
  if (window.mixpanel) {
    const properties: Properties = {}
    properties.label = label
    properties.value = value
    window.mixpanel.track(eventName, properties)
  }
}

export const identify = (id: string) => {
  if (window.mixpanel) {
    window.mixpanel.identify(id)
  }
}

export const reset = () => {
  if (window.mixpanel) {
    window.mixpanel.reset()
  }
}
