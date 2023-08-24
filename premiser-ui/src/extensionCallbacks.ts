import { MouseEvent } from "react";

import {
  JustificationView,
  MediaExcerptView,
  UrlLocator,
  UrlOut,
} from "howdju-common";
import { actions, inIframe } from "howdju-client-common";

import { AppDispatch } from "./setupStore";
import { OnClickJustificationWritQuoteUrl, OnClickUrlLocator } from "./types";

export function makeExtensionHighlightOnClickWritQuoteUrlCallback(
  dispatch: AppDispatch
): OnClickJustificationWritQuoteUrl {
  // A method for top-level components that want to highlight justifications using the extension
  return function extensionHighlightingOnClickWritQuoteUrl(
    event: MouseEvent,
    justification: JustificationView,
    url: UrlOut
  ) {
    // If we aren't in the extension iframe, then allow the native behavior of the link click
    if (!inIframe()) {
      return;
    }
    // Otherwise prevent click from navigating and instead update the page hosting the extension iframe
    event.preventDefault();
    dispatch(actions.extension.highlightTarget(justification, url));
  };
}

export function makeExtensionHighlightOnClickUrlLocatorCallback(
  dispatch: AppDispatch
): OnClickUrlLocator {
  // A method for top-level components that want to highlight justifications using the extension
  return function extensionHighlightingOnClickUrlLocator(
    event: MouseEvent,
    mediaExcerpt: MediaExcerptView,
    urlLocator: UrlLocator
  ) {
    // If we aren't in the extension iframe, then allow the native behavior of the link click
    if (!inIframe()) {
      return;
    }
    if (!urlLocator.anchors?.length) {
      return;
    }
    // Otherwise prevent click from navigating and instead update the page hosting the extension iframe
    event.preventDefault();
    dispatch(actions.extension.highlightUrlLocator(mediaExcerpt, urlLocator));
  };
}
