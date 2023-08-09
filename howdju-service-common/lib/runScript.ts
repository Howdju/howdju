import fs from "fs";
import { toJson } from "howdju-common";
import { DOMWindow } from "jsdom";

export function runScriptAction<T>(
  window: DOMWindow,
  scriptName: string,
  scriptAction: string
) {
  // Add the script to the JSDOM page.
  // See https://github.com/jsdom/jsdom/wiki/Don't-stuff-jsdom-globals-onto-the-Node-global#running-code-inside-the-jsdom-context
  const scriptSource = readTextFragmentsScript(scriptName);
  try {
    window.eval(scriptSource);
  } catch (err) {
    if (
      err instanceof window.Error &&
      err.message.includes("ReferenceError: window is not defined")
    ) {
      const message = `Error evaluating ${scriptName} for (${err.message}. Did you forget to set runScripts: 'outside-only' in the JSDOM options?`;
      throw new Error(message);
    }
    const message = err instanceof window.Error ? err.message : toJson(err);
    throw new Error(message);
  }
  try {
    window.eval(`window.scriptResult = ${scriptAction};`);
  } catch (err) {
    const message = err instanceof window.Error ? err.message : toJson(err);
    throw new Error(message);
  }
  return window.scriptResult as T;
}

function readTextFragmentsScript(scriptName: string) {
  if (fs.existsSync(`../howdju-text-fragments/dist/${scriptName}.js`)) {
    return fs.readFileSync(`../howdju-text-fragments/dist/${scriptName}.js`, {
      encoding: "utf-8",
    });
  }
  if (fs.existsSync(`./${scriptName}.js`)) {
    return fs.readFileSync(`./${scriptName}.js`, {
      encoding: "utf-8",
    });
  }
  throw new Error(`Unable to find ${scriptName} script`);
}
