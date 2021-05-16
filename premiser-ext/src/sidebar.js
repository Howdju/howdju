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
    const url = baseUrl + '/recent-activity'
    const App = <FramePanel url={url} onMount={onFramePanelMount}  />
    ReactDOM.render(App, root)
  })
}

function onFramePanelMount(api) {
  frameApi = api
}
