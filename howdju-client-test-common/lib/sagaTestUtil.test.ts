import { testSaga } from "./sagaTestUtil";
import { createAction, createReducer } from "@reduxjs/toolkit";
import { getContext, put, select } from "redux-saga/effects";

describe("sagaTestUtil", () => {
  describe("testSaga", () => {
    it("should provide access to the context", async () => {
      const testContext = { testKey: "testValue" };
      function* testSagaFn(): Generator<any, void, any> {
        const value = yield getContext("testKey");
        expect(value).toBe("testValue");
      }

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await testSaga(testSagaFn, testContext, () => {});
    });

    it("should allow reducer to mutate state", async () => {
      const increment = createAction("INCREMENT");
      const initialState = { count: 0 };
      const reducer = createReducer(initialState, (builder) => {
        builder.addCase(increment, (state) => {
          state.count += 1;
        });
      });

      function* testSagaFn(): Generator<any, void, any> {
        yield put(increment());
        const state = yield select((state) => state.counter.count);
        expect(state).toBe(1);
      }

      await testSaga(testSagaFn, {}, { counter: reducer });
    });
  });
});
