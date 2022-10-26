import { CounteredJustification, Url, WritQuote } from "howdju-common"
import {
  actions,
  inIframe,
} from "howdju-client-common"

import { AppDispatch } from "./store"
import { MouseEvent } from "react"

export function makeExtensionHighlightOnClickWritQuoteUrlCallback(dispatch: AppDispatch) {
  // A method for top-level components that want to highlight justifications using the extension
  return function extensionHighlightingOnClickWritQuoteUrl
  (
    event: MouseEvent<HTMLElement>,
    justification: CounteredJustification,
    writQuote: WritQuote,
    url: Url,
  ) {
    // If we aren't in the extension iframe, then allow the native behavior of the link click
    if (!inIframe()) {
      return
    }
    // Otherwise prevent click from navigating and instead update the page hosting the extension iframe
    event.preventDefault()
    dispatch(actions.extension.highlightTarget(justification, writQuote, url))
  }
}
