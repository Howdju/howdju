/* Hot module replace needs these dynamic import globals */
/* globals module require */
import {createStore, applyMiddleware, compose} from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import createRootReducer from './reducers/index'
import {logger} from './logger'
import config from './config'
import {history} from './history'
import * as actionCreators from './actions'
import getSagas from './sagas'
import {BASIC_FUNCTIONALITY, cookieConsent} from "./cookieConsent"

// TODO(#85): replace with library Redux DevTools.
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const composeEnhancers =
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      actionCreators,
      trace: config.reduxDevtoolsExtension.doTrace,
      traceLimit: config.reduxDevtoolsExtension.traceLimit,
    }) : compose
const sagaMiddleware = createSagaMiddleware({
  onError: (error, { sagaStack }) => {
    logger.error(`Uncaught error in sagas: ${error}: ${sagaStack}`)
    logger.exception(error, {
      extra: {
        source: 'howdju/redux-saga',
        sagaStack,
      }
    })
  }
})

// Don't persist app data until we have consent
const serialize = (data: any) => {
  return cookieConsent.isAccepted(BASIC_FUNCTIONALITY) ? JSON.stringify(data) : ''
}
const persistedReducer = persistReducer({
  key: 'root',
  storage,
  serialize,
  whitelist: config.reduxPersistWhitelist,
}, createRootReducer(history))

const store = createStore(
  persistedReducer,
  window.__INITIAL_STATE__,
  composeEnhancers(
    applyMiddleware(
      routerMiddleware(history),
      sagaMiddleware
    ),
  )
)

const persistor = persistStore(store)

export {store, persistor}
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

let rootTask = sagaMiddleware.run(function* () {
  yield getSagas()
})

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers/index', () => {
    store.replaceReducer(createRootReducer(history))
  })
  module.hot.accept('./sagas', () => {
    const getNewSagas = require('./sagas').default
    rootTask.cancel()
    rootTask.toPromise().then(() => {
      rootTask = sagaMiddleware.run(function* replacedSaga() {
        yield getNewSagas()
      })
    })
  })
}


export function persist() {
  persistor.persist()
}
