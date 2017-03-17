import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import UiContainer from './UiContainer'

const root = document.getElementById('root')

const renderComponent = Component => {
  ReactDOM.render(
      <AppContainer>
        <Component />
      </AppContainer>,
      root
  )
}

renderComponent(UiContainer)

// https://github.com/gaearon/react-hot-loader/tree/master/docs#webpack-2
if (module.hot) {
  module.hot.accept('./UiContainer', () => { renderComponent(UiContainer) })
}