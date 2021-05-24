import {inIframe} from "howdju-client-common"

// A method for top-level components that want to highlight justifications using the extension
export function extensionHighlightingOnClickWritQuoteUrl(highlightTarget, event, justification, writQuote, url) {
  // If we aren't in the extension iframe, then allow the native behavior of the link click
  if (!inIframe()) {
    return
  }
  // Otherwise prevent click from navigating and instead update the page hosting the extension iframe
  event.preventDefault()
  highlightTarget(justification, writQuote, url)
}
