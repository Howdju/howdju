import { createStore, applyMiddleware, compose } from 'redux'
import createHistory from 'history/createBrowserHistory'
import { routerMiddleware } from 'react-router-redux'
import {autoRehydrate, persistStore} from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import rootReducer from './reducers';
import getSagas from './sagas';

export const history = createHistory()

export default function configureStore(initialState) {
  const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
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

  let sagaTask = sagaMiddleware.run(function* () {
    yield getSagas()
  })
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers', () => {
      const nextRootReducer = require('./reducers').default;
      store.replaceReducer(nextRootReducer);
    });
    module.hot.accept('./sagas', () => {
      const getNewSagas = require('./sagas').default;
      sagaTask.cancel()
      sagaTask.done.then(() => {
        sagaTask = sagaMiddleware.run(function* replacedSaga() {
          yield getNewSagas()
        })
      })
    })
  }

  return store;
}