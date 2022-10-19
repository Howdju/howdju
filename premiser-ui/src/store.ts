/* Hot module replace needs these dynamic import globals */
/* globals module require */
import {createStore, applyMiddleware, PreloadedState, ActionCreator, Reducer, AnyAction} from 'redux'
import { persistStore, persistReducer, PersistorOptions } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import {composeWithDevToolsDevelopmentOnly} from '@redux-devtools/extension'
import { all } from 'redux-saga/effects'
import values from 'lodash/values'

import createRootReducer from './reducers/index'
import {logger} from './logger'
import config from './config'
import {history} from './history'
import * as actionCreatorsUntyped from './actions'
import getSagas from './sagas'
import * as sagaSlices from './sagaSlices'

declare global {
  interface Window {
    __INITIAL_STATE__?: PreloadedState<ExtractReducerState<typeof rootReducer>>
  }
}
type ExtractReducerState<T> = T extends Reducer<infer S> ? S : never

// TODO(1): Remove typecasting.
const actionCreators = actionCreatorsUntyped as unknown as { [key: string]: ActionCreator<any>; }
const storeEnhancerComposer = composeWithDevToolsDevelopmentOnly({
  actionCreators,
  trace: config.reduxDevtoolsExtension.doTrace,
  traceLimit: config.reduxDevtoolsExtension.traceLimit,
});

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

const rootReducer = createRootReducer(history)

const persistedReducer = persistReducer({
  key: 'root',
  storage,
  whitelist: config.reduxPersistWhitelist,
}, rootReducer) as typeof rootReducer


const store = createStore(
  persistedReducer,
  window.__INITIAL_STATE__,
  storeEnhancerComposer(
    applyMiddleware(
      routerMiddleware(history),
      sagaMiddleware
    ),
  )
)

const persistor = persistStore(store, {manualPersist: true} as PersistorOptions)

export {store, persistor}
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

let rootTask = sagaMiddleware.run(function* sagaMiddlewareSaga() {
  // Run both regular and saga-slice sagas.
  yield all([
    getSagas(),
    ...values(sagaSlices)
      .flatMap(s => s.sagas)
      .map(saga => saga()),
  ])
})

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers/index', () => {
    store.replaceReducer(createRootReducer(history) as unknown as Reducer<RootState, AnyAction>)
  })
  module.hot.accept('./sagas', () => {
    const getNewSagas = require('./sagas').default
    const newSagaSlices = require('./sagaSlices')
    rootTask.cancel()
    rootTask.toPromise().then(() => {
      rootTask = sagaMiddleware.run(function* replacedSaga() {
        // Run both regular and saga-slice sagas.
        yield all([
          getNewSagas(),
          ...values(newSagaSlices)
            .flatMap(s => s.sagas)
            .map(saga => saga()),
        ])
      })
    })
  })
}

// Tell the persistor to start persisting.
//
// See manualPersist at
// https://github.com/rt2zz/redux-persist#persiststorestore-config-callback
export function startPersisting() {
  persistor.persist()
}

export function stopPersisting() {
  persistor.pause();
  persistor.purge().catch(err => {
    logger.error("Failed to purge redux persistance.");
    logger.exception(err);
  });
}
