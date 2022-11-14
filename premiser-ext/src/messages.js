export const TOGGLE_SIDEBAR = "TOGGLE_SIDEBAR";
export const toggleSidebar = () => ({ type: TOGGLE_SIDEBAR });

export const ANNOTATE_SELECTION = "ANNOTATE_SELECTION";
export const annotateSelection = () => ({ type: ANNOTATE_SELECTION });

export const RUN_COMMANDS_WHEN_TAB_RELOADED = "RUN_COMMANDS_WHEN_TAB_RELOADED";
/** We can't pass closures across the extension boundary, so instead pass a
 * data structure describing commands to run. */
export const runCommandsWhenTabReloaded = (commands) => ({
  type: RUN_COMMANDS_WHEN_TAB_RELOADED,
  payload: { commands },
});

export const RUN_COMMANDS = "RUN_COMMANDS";
export const runCommands = (commands) => ({
  type: RUN_COMMANDS,
  payload: { commands },
});
