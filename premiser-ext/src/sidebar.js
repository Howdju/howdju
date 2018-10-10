import React from 'react'
import ReactDOM from 'react-dom'
import { FramePanel } from './frame-panel'
import { url } from './settings'

export function toggleSidebar() {
  if (FramePanel.isReady()) {
    FramePanel.toggle()
  } else {
    boot()
  }
}

function boot() {
  const root = document.createElement('div')
  document.body.appendChild(root)

  const App = (
    <FramePanel url={url} />
  )

  ReactDOM.render(App, root)
}
