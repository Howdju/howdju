import React from "react";
import ReactDOM from "react-dom";

import { getOption } from "./options";
import { FramePanel, FramePanelApi } from "./framePanel";
import { getCanonicalOrCurrentUrl } from "howdju-client-common";
import { commonPaths } from "howdju-common";

let frameApi: FramePanelApi;

export function getFrameApi() {
  return frameApi;
}

export function toggleSidebar() {
  if (frameApi) {
    frameApi.toggle();
  } else {
    boot();
  }
}

export function showSidebar() {
  if (frameApi) {
    frameApi.show();
  } else {
    boot();
  }
}

function boot() {
  const root = document.createElement("div");
  document.body.appendChild(root);

  getOption("howdjuBaseUrl", (baseUrl) => {
    // TODO move paths to howdju-client-common: paths.searchJustificaitons({url, includeUrls: true})
    const url = getCanonicalOrCurrentUrl();
    const frameUrlObj = new URL(baseUrl);
    frameUrlObj.pathname = commonPaths.searchMediaExcerpts();
    frameUrlObj.searchParams.set("url", url);
    const frameUrl = frameUrlObj.toString();
    const App = <FramePanel url={frameUrl} onMount={onFramePanelMount} />;
    ReactDOM.render(App, root);
  });
}

function onFramePanelMount(api: FramePanelApi) {
  frameApi = api;
}
