/* Hot module replace needs these dynamic import globals */
/* globals module require */
import {ActionCreator, Reducer, AnyAction} from 'redux'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'

import createRootReducer from './reducers/index'
import {logger} from './logger'
import config from './config'
import {history} from './history'
import * as actionCreatorsUntyped from './actions'
import getSagas from './sagas'


// TODO(1): Remove typecasting.
const actionCreators = actionCreatorsUntyped as unknown as { [key: string]: ActionCreator<any>; }

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
}, rootReducer) as RootReducer

export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
  const store = configureStore({
    reducer: persistedReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([
      routerMiddleware(history),
      sagaMiddleware,
    ]),
    devTools: process.env.NODE_ENV !== 'production' ? {
      actionCreators,
      trace: config.reduxDevtoolsExtension.doTrace,
      traceLimit: config.reduxDevtoolsExtension.traceLimit,
    } : false,
  })
  let rootTask = sagaMiddleware.run(function* () {
    yield getSagas()
  })

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers/index', () => {
      store.replaceReducer(createRootReducer(history) as unknown as Reducer<RootState, AnyAction>)
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
  return store
}
export type RootReducer = typeof rootReducer
export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
