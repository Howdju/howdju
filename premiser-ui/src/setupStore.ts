/* Hot module replace needs these dynamic import globals */
/* globals module */
import { ActionCreator, Reducer, AnyAction } from "redux";
import { configureStore, PreloadedState } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { routerMiddleware } from "connected-react-router";
import createSagaMiddleware from "redux-saga";
import { History } from "history";

import createRootReducer from "./reducers";
import { logger } from "./logger";
import config from "./config";
import * as actionCreatorsUntyped from "./actions";
import getSagas from "./sagas";
import { toString } from "lodash";

const actionCreators = actionCreatorsUntyped as unknown as {
  [key: string]: ActionCreator<any>;
};

export const sagaMiddleware = createSagaMiddleware({
  onError: (error, { sagaStack }) => {
    logger.error(`Uncaught error in sagas: ${error}: ${sagaStack}`);
    logger.exception(error, {
      extra: {
        source: "howdju/redux-saga",
        sagaStack,
      },
    });
  },
});

export const setupStore = (
  history: History<any>,
  preloadedState?: PreloadedState<RootState>
) => {
  const rootReducer = createRootReducer(history);
  const persistedReducer = persistReducer(
    {
      key: "root",
      storage,
      whitelist: config.reduxPersistWhitelist,
    },
    rootReducer
  ) as RootReducer;
  const store = configureStore({
    reducer: persistedReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredActionPaths: [
            // The normalization schemas are convenient to have, but non-serializable. We could also
            // include a string identifier/descriptor of the normalization schema and look it up
            // when we need it.
            // TODO(154) remove these ignores
            "payload.normalizationSchema",
            "meta.normalizationSchema",
            "payload.itemFactory",
            // TODO(472) remove once we remove error-logging Saga.
            "errors.loggedErrors",
          ],
        },
      }).concat([routerMiddleware(history), sagaMiddleware]),
    devTools:
      process.env.NODE_ENV !== "production"
        ? {
            actionCreators,
            trace: config.reduxDevtoolsExtension.doTrace,
            traceLimit: config.reduxDevtoolsExtension.traceLimit,
          }
        : false,
  });
  let rootTask = sagaMiddleware.run(function* saga() {
    yield getSagas();
  });

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept("./reducers", () => {
      store.replaceReducer(
        createRootReducer(history) as unknown as Reducer<RootState, AnyAction>
      );
    });
    module.hot.accept(
      "./sagas",
      () => {
        rootTask.cancel();
        rootTask.toPromise().then(
          () => {
            rootTask = sagaMiddleware.run(function* saga() {
              yield getSagas();
            });
          },
          (err: Error) => {
            console.log(`Error during sagas HMR: ${toString(err)}`);
          }
        );
      },
      (err: Error) => {
        console.log(`Error during sagas HMR: ${toString(err)}`);
      }
    );
  }
  return store;
};
export type RootReducer = ReturnType<typeof createRootReducer>;
export type RootState = ReturnType<RootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
