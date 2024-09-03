import { RequireExactlyOne } from "type-fest";

import { DomAnchor, UrlTarget } from "howdju-common";

import * as actions from "./extensionActions";
import { ExtensionFrameActionName } from "./extensionActions";

/**
 * Contains an `ExtensionFrameAction` for the content script to send to the iframed web app.
 *
 * This type describes the contents of the `ContentScriptCommand` `postActionMessageToFrame`
 */
type ExtensionFrameCommand = RequireExactlyOne<
  {
    [key in ExtensionFrameActionName]: Parameters<
      typeof actions.extensionFrame[key]
    >;
  },
  ExtensionFrameActionName
>;
/**
 * Something the content script can do.
 *
 * Used both to pass the work as a message and to perist the work in the future (e.g. if the content
 * page needs to reload before the content script can do th work.)
 *
 * Not a redux action.
 */
export type ContentScriptCommand =
  | {
      postActionMessageToFrame: ExtensionFrameCommand;
    }
  | {
      annotateTarget: [UrlTarget];
    }
  | {
      annotateUrlLocatorAnchors: DomAnchor[];
    };

export const toggleSidebar = () => ({ type: "TOGGLE_SIDEBAR" } as const);

export const annotateSelection = () =>
  ({ type: "ANNOTATE_SELECTION" } as const);

/** We can't pass closures across the extension boundary, so instead pass a
 * data structure describing commands to run. */
export const runCommandsWhenTabReloaded = (commands: ContentScriptCommand[]) =>
  ({
    type: "RUN_COMMANDS_WHEN_TAB_RELOADED",
    payload: { commands },
  } as const);

export const runCommands = (commands: ContentScriptCommand[]) =>
  ({
    type: "RUN_COMMANDS",
    payload: { commands },
  } as const);

/** Messages for signaling between the background page and a content script in a tab. */
export type ExtensionMessage = ReturnType<
  | typeof toggleSidebar
  | typeof annotateSelection
  | typeof runCommandsWhenTabReloaded
  | typeof runCommands
>;
