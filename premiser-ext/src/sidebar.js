import React from 'react'
import ReactDOM from 'react-dom'

import { getOption } from './options'
import { FramePanel } from './frame-panel'

let iframe

export function getIframe() {
  return iframe
}

export function toggleSidebar() {
  if (FramePanel.isReady()) {
    FramePanel.toggle()
  } else {
    boot()
  }
}

export function showSidebar(onShow) {
  if (FramePanel.isReady()) {
    FramePanel.show(onShow)
  } else {
    boot(onShow)
  }
}

function boot(onLoad) {
  const root = document.createElement('div')
  document.body.appendChild(root)

  getOption('howdjuBaseUrl', (baseUrl) => {
    const url = baseUrl + '/recent-activity'
    const App = <FramePanel url={url} onMount={onFramePanelMount} onLoad={onLoad} />
    ReactDOM.render(App, root)
  })
}

function onFramePanelMount({frame}) {
  iframe = frame
}