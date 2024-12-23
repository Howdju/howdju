import {
  configureStore,
  Reducer,
  type Action,
  type AnyAction,
  type ReducersMapObject,
} from "@reduxjs/toolkit";
import createSagaMiddleware, { Saga } from "redux-saga";

/** Run a saga with the redux store etc. in place. */
export async function testSaga<
  C extends object = Record<string, never>,
  S = any,
  A extends Action = AnyAction
>(
  saga: Saga<any[]>,
  context: C = {} as C,
  reducer: Reducer<S, A> | ReducersMapObject<S, A>
) {
  const sagaMiddleware = createSagaMiddleware({
    context,
  });
  configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(sagaMiddleware),
  });
  await sagaMiddleware.run(saga).toPromise();
}
