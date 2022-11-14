import * as googleAnalytics from "./googleAnalytics";
import * as mixpanel from "./mixpanel";
import * as heapAnalytics from "./heapAnalytics";

export const sendPageView = (path: string) => {
  googleAnalytics.sendPageView(path);
};

export const sendEvent = (
  category: string,
  action: string,
  label?: string,
  value?: string,
  isNonInteraction = false
) => {
  googleAnalytics.sendEvent(category, action, label, value, isNonInteraction);
  const eventName = `${category} - ${action}`;
  mixpanel.track(eventName, label, value);
  heapAnalytics.track(eventName, label, value);
};

export const trackOutboundLinkClick = (url: string) => {
  googleAnalytics.trackOutboundLinkClick(url);
};

interface ExternalIds {
  googleAnalyticsId: string;
  mixpanelId: string;
  heapAnalyticsId: string;
}

export const identify = (externalIds: ExternalIds) => {
  const { googleAnalyticsId, mixpanelId, heapAnalyticsId } = externalIds;
  if (googleAnalyticsId) {
    googleAnalytics.setUserId(googleAnalyticsId);
  }
  if (mixpanelId) {
    mixpanel.identify(mixpanelId);
  }
  if (heapAnalyticsId) {
    heapAnalytics.identify(heapAnalyticsId);
  }
};

export const unidentify = () => {
  googleAnalytics.unsetUserId();
  mixpanel.reset();
  heapAnalytics.resetIdentity();
};
