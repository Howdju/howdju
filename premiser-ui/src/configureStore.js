/* Hot module replace needs these dynamic import globals */
/* globals module require */
import { createStore, applyMiddleware, compose } from 'redux'
import {autoRehydrate, persistStore} from 'redux-persist'
import { routerMiddleware, connectRouter } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import rootReducer from './reducers/index'
import getSagas from './sagas'
import {logger} from './logger'
import config from './config'
import {history} from './history'
import * as actionCreators from './actions'

export default function configureStore(initialState) {
  const composeEnhancers =
    typeof window === 'object' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        actionCreators,
        trace: config.reduxDevtoolsExtension.doTrace,
        traceLimit: config.reduxDevtoolsExtension.traceLimit,
      }) : compose
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    connectRouter(history)(rootReducer),
    initialState,
    composeEnhancers(
      autoRehydrate(),
      applyMiddleware(
        routerMiddleware(history),
        sagaMiddleware
      ),
    )
  )

  persistStore(store, {
    whitelist: config.reduxPersistWhitelist
  })

  let rootTask = sagaMiddleware.run(function* () {
    yield getSagas()
  })
  rootTask.done.catch(err => {
    logger.error('Uncaught error in sagas')
    logger.exception(err)
  })

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers/index', () => {
      // For connected-react-router 5+
      // https://github.com/supasate/connected-react-router/blob/master/FAQ.md#how-to-hot-reload-reducers
      // store.replaceReducer(createRootReducer(history))
      const nextRootReducer = require('./reducers/index').default
      store.replaceReducer(nextRootReducer)
    })
    module.hot.accept('./sagas', () => {
      const getNewSagas = require('./sagas').default
      rootTask.cancel()
      rootTask.done.then(() => {
        rootTask = sagaMiddleware.run(function* replacedSaga() {
          yield getNewSagas()
        })
        rootTask.done.catch(err => logger.error('Uncaught error in sagas', err))
      })
    })
  }

  return store
}
