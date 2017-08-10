import * as googleAnalytics from "./googleAnalytics";
import * as mixpanel from "./mixpanel";
import * as heapAnalytics from './heapAnalytics'

export const sendPageView = path => {
  googleAnalytics.sendPageView(path)
}

export const sendEvent = (category, action, label = null, value = null, isNonInteraction = false) => {
  googleAnalytics.sendEvent(category, action, label, value, isNonInteraction)
  const eventName = `${category} - ${action}`
  mixpanel.track(eventName, label, value)
  heapAnalytics.track(eventName, label, value)
}

export const trackOutboundLinkClick = url => {
  googleAnalytics.trackOutboundLinkClick(url)
}

export const identify = externalIds => {
  const {
    googleAnalyticsId,
    mixpanelId,
    heapAnalyticsId,
  } = externalIds
  if (googleAnalyticsId) {
    googleAnalytics.setUserId(googleAnalyticsId)
  }
  if (mixpanelId) {
    mixpanel.identify(mixpanelId)
  }
  if (heapAnalyticsId) {
    heapAnalytics.identify(heapAnalyticsId)
  }
}