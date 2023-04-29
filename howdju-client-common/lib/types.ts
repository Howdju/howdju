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
