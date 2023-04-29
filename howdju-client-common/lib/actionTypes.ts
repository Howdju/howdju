import { extensionFrame } from "./actions";

export type ExtensionFrameActionName = keyof typeof extensionFrame;
export type ExtensionFrameActionCreator =
  typeof extensionFrame[ExtensionFrameActionName];
/** An extensionFrame action. */
export type ExtensionFrameAction = ReturnType<
  typeof extensionFrame[keyof typeof extensionFrame]
>;
