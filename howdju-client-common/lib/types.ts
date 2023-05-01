import { ExtensionFrameAction } from "./actions";

export type WindowMessageSource = "extension";

/**
 * Container for sending an `ExtensionFrameAction` to the iframed web app.
 *
 * Adds a `source`.
 */
export interface IframedAppMessage {
  source: WindowMessageSource;
  action: ExtensionFrameAction;
}

export function isIframedAppMessage(
  event: MessageEvent<any>
): event is MessageEvent<IframedAppMessage> {
  if (!("data" in event)) {
    return false;
  }
  if (!("source" in event.data) || typeof event.data !== "string") {
    return false;
  }
  return true;
}
