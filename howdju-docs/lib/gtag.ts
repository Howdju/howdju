// https://developers.google.com/tag-platform/gtagjs/reference#event
// https://developers.google.com/tag-platform/gtagjs/reference/events#page_view
export const pageView = () => {
  const page_location = window.location.href;
  window.gtag("event", "page_view", { page_location });
};
