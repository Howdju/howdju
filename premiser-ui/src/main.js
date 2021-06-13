// Babel runtime dependencies
import "core-js/stable"
import "regenerator-runtime/runtime"

// Must come before react
import 'react-hot-loader'

import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Configuration, ConfigurationProps } from "@react-md/layout"
import { PersistGate } from 'redux-persist/integration/react'
import moment from "moment"
import momentDurationFormatSetup from "moment-duration-format"

import App from './App'
import config  from './config'
import {cookieConsent, ERROR_REPORTING} from './cookieConsent'
import {configureStore} from './configureStore'
import sentryInit from './sentryInit'

if (config.sentry.enabled && cookieConsent.isAccepted(ERROR_REPORTING)) {
  sentryInit()
}

momentDurationFormatSetup(moment)

const root = document.getElementById('root')

const {store, persistor} = configureStore(window.__INITIAL_STATE__)

const overrides: ConfigurationProps = {
  // your react-md configuration overrides
}

render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Configuration {...overrides}>
        <App />
      </Configuration>
    </PersistGate>
  </Provider>,
  root
)
