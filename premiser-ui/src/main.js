/* globals module */
import 'babel-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { AppContainer as ReactHotLoaderContainer } from 'react-hot-loader'
import moment from "moment"
import momentDurationFormatSetup from "moment-duration-format"

import App from './App'
import configureStore from './configureStore'
import sentryInit from './sentryInit'

sentryInit()

momentDurationFormatSetup(moment)

const root = document.getElementById('root')

const store = configureStore(window.__INITIAL_STATE__)

const renderApp = AppComponent => {
  ReactDOM.render(
    <ReactHotLoaderContainer>
      <Provider store={store}>
        <AppComponent />
      </Provider>
    </ReactHotLoaderContainer>,
    root
  )
}

renderApp(App)

// https://github.com/gaearon/react-hot-loader/tree/master/docs#webpack-2
if (module.hot) {
  module.hot.accept('./App', () => { renderApp(App) })
}
