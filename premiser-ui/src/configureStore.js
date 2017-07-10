import { createStore, applyMiddleware, compose as reduxCompose } from 'redux'
import createHistory from 'history/createBrowserHistory'
import { routerMiddleware } from 'react-router-redux'
import {autoRehydrate, persistStore} from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import rootReducer from './reducers/index';
import getSagas from './sagas';
import {logger} from './util';

export const history = createHistory()

export default function configureStore(initialState) {
  const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || reduxCompose
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
      rootReducer,
      initialState,
      compose(
          autoRehydrate(),
          applyMiddleware(
              routerMiddleware(history),
              sagaMiddleware
          ),
      )
  )

  persistStore(store, {
    whitelist: ['auth']
  });

  let rootTask = sagaMiddleware.run(function* () {
    yield getSagas()
  })
  rootTask.done.catch(err => logger.error('Uncaught error in sagas', err))

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers/index', () => {
      const nextRootReducer = require('./reducers/index').default;
      store.replaceReducer(nextRootReducer);
    });
    module.hot.accept('./sagas', () => {
      const getNewSagas = require('./sagas').default;
      rootTask.cancel()
      rootTask.done.then(() => {
        rootTask = sagaMiddleware.run(function* replacedSaga() {
          yield getNewSagas()
        })
        rootTask.done.catch(err => logger.error('Uncaught error in sagas', err))
      })
    })
  }

  return store;
}