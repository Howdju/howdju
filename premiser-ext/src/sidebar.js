import React from 'react'
import ReactDOM from 'react-dom'

import { getOption } from './options'
import { FramePanel } from './frame-panel'

let frameApi

export function getFrameApi() {
  return frameApi
}

export function toggleSidebar() {
  if (frameApi) {
    frameApi.toggle()
  } else {
    boot()
  }
}

export function showSidebar() {
  if (frameApi) {
    frameApi.show()
  } else {
    boot()
  }
}

function boot() {
  const root = document.createElement('div')
  document.body.appendChild(root)

  getOption('howdjuBaseUrl', (baseUrl) => {
    // TODO move paths to howdju-client-common: paths.searchJustificaitons({url, includeUrls: true})
    const url = encodeURIComponent(document.location.href)
    const frameUrl = baseUrl + `/search-justifications?url=${url}&includeUrls=true`
    const App = <FramePanel url={frameUrl} onMount={onFramePanelMount}  />
    ReactDOM.render(App, root)
  })
}

function onFramePanelMount(api) {
  frameApi = api
}
