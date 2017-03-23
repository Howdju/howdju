import 'babel-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { AppContainer as ReactHotLoaderContainer } from 'react-hot-loader'

import App from './App'
import appReducer from './reducers'
import appSaga from './sagas'

const root = document.getElementById('root')
const sagaMiddleware = createSagaMiddleware()

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
let store = createStore(appReducer, composeEnhancers(applyMiddleware(sagaMiddleware)))
sagaMiddleware.run(appSaga)

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

  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers', () => {
    const nextRootReducer = require('./reducers').default
    store.replaceReducer(nextRootReducer)
  })
}