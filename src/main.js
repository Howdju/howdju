import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer as ReactHotLoaderContainer } from 'react-hot-loader'
import AppContainer from './AppContainer'

const root = document.getElementById('root')

const renderInHotLoader = Component => {
  ReactDOM.render(
      <ReactHotLoaderContainer>
        <Component />
      </ReactHotLoaderContainer>,
      root
  )
}

renderInHotLoader(AppContainer)

// https://github.com/gaearon/react-hot-loader/tree/master/docs#webpack-2
if (module.hot) {
  module.hot.accept('./AppContainer', () => { renderInHotLoader(AppContainer) })
}