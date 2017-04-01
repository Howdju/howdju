import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import rootReducer from './reducers';
import getSagas from './sagas';

export default function configureStore(initialState) {
  const sagaMiddleware = createSagaMiddleware()
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  let store = createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(sagaMiddleware)))
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