import "core-js/stable"
import "regenerator-runtime/runtime"

// Must come before react
import 'react-hot-loader'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import moment from "moment"
import momentDurationFormatSetup from "moment-duration-format"

import App from './App'
import config  from './config'
import configureStore from './configureStore'
import sentryInit from './sentryInit'

if (config.sentry.enabled) {
  sentryInit()
}

momentDurationFormatSetup(moment)

const root = document.getElementById('root')

const {store, persistor} = configureStore(window.__INITIAL_STATE__)

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
  root
)
