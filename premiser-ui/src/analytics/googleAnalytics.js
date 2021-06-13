export const sendPageView = path => {
  if (window.ga) {
    window.ga('set', 'page', path)
    window.ga('send', 'pageview')
  }
}

/*
 https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 https://developers.google.com/analytics/devguides/collection/analyticsjs/command-queue-reference#send
 */
export const sendEvent = (category, action, label = null, value = null, isNonInteraction = false) => {
  if (window.ga) {
    const fields = {
      eventCategory: category,
      eventAction: action,
    }
    if (label) {
      fields.eventLabel = label
    }
    if (value) {
      fields.eventValue = value
    }
    if (isNonInteraction) {
      fields.nonInteraction = true
    }
    window.ga('send', 'event', fields)
  }
}

export const trackOutboundLinkClick = url => {
  if (window.ga) {
    window.ga('send', 'event', {
      eventCategory: 'Outbound Link',
      eventAction: 'click',
      eventLabel: url,
      transport: 'beacon',
    })
  }
}

export const setUserId = googleAnalyticsUserId => {
  if (window.ga) {
    window.ga('set', 'userId', googleAnalyticsUserId)
  }
}

export const unsetUserId = () => {
  if (window.ga) {
    // Does this work?
    // window.ga('set', 'userId', undefined)
    // Do we need this? Or does this stop events entirely?
    window.ga('remove')
  }
}
