import { ExtensionFrameAction } from "./actions";

export const WindowMessageSource = "HowdjuExtension" as const;
export type WindowMessageSource = typeof WindowMessageSource;

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
  if (!("source" in event.data) || event.data.source !== WindowMessageSource) {
    return false;
  }
  return true;
}
