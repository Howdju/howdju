/* Hot module replace needs these dynamic import globals */
/* globals module require */
import { createStore, applyMiddleware, compose } from 'redux'
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

export default function configureStore(initialState) {
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

  const persistedReducer = persistReducer({
    key: 'root',
    storage,
    whitelist: config.reduxPersistWhitelist,
  }, createRootReducer(history))

  const store = createStore(
    persistedReducer,
    initialState,
    composeEnhancers(
      applyMiddleware(
        routerMiddleware(history),
        sagaMiddleware
      ),
    )
  )

  const persistor = persistStore(store)

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

  return {persistor, store}
}
