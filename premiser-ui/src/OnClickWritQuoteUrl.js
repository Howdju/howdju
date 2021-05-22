import {inIframe} from "howdju-client-common"

// A method that must appear between a use of extensionHighlightingOnClickWritQuoteUrl
// and the invocation of the onClickWritQuoteUrl in WritQuoteViewer's onClickUrl in
// order to add the justification argument
export function justificationContainerOnClickWritQuoteUrl(event, writQuote, url) {
  if (this.props.onClickWritQuoteUrl) {
    this.props.onClickWritQuoteUrl(event, this.props.justification, writQuote, url)
  }
}

// A method for top-level components that want to highlight justifications using the extension
export function extensionHighlightingOnClickWritQuoteUrl(event, justification, writQuote, url) {
  // If we aren't in the extension iframe, then allow the native behavior of the link click
  if (!inIframe()) {
    return
  }
  // Otherwise prevent click from navigating and instead update the page hosting the extension iframe
  event.preventDefault()
  this.props.extension.highlightTarget(justification, writQuote, url)
}
