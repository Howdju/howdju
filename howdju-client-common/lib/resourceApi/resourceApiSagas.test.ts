import { fork, put, all } from "typed-redux-saga";
import { rest } from "msw";
import { REHYDRATE } from "redux-persist/lib/constants";

import { Api, api } from "howdju-client-common";
import { testSaga, withMockServer } from "howdju-client-test-common";
import { withFakeTimers } from "howdju-test-common";

import { flagRehydrate } from "../hydration";
import { callApiForResource, resourceApiCalls } from "./resourceApiSagas";
import { createReducer } from "@reduxjs/toolkit";

const server = withMockServer();

withFakeTimers();

const context = {
  config: { rehydrateTimeoutMs: 1 },
  api: new Api({ apiRoot: "http://localhost" }),
};
const reducer = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  auth: createReducer({ authToken: undefined }, () => {}),
};

function* rehydrate() {
  yield* put({ type: REHYDRATE });
}

describe("callApiForResource", () => {
  test("a call with the same cancelKey cancels an pending call", async () => {
    // Arrange
    const propositions = [
      { id: 1, text: "The first proposition." },
      { id: 2, text: "The second proposition." },
    ];
    server.use(
      rest.get("http://localhost/search-propositions", (_req, res, ctx) => {
        // delay so that we can cancel the request.
        return res(ctx.delay(500), ctx.json({ propositions }));
      })
    );

    const suggestionsKey = "the-suggestions-key";
    function* saga() {
      const task = yield* fork(
        callApiForResource,
        api.fetchPropositionTextSuggestions(
          "the proposition text",
          suggestionsKey
        )
      );

      // Act
      const result = yield* callApiForResource(
        api.fetchPropositionTextSuggestions(
          "the proposition text again",
          suggestionsKey
        )
      );

      // Assert
      expect(task.isCancelled()).toBeTrue();
      expect(result.payload).toEqual({ propositions });
    }
    await testSaga(
      function* () {
        yield all([flagRehydrate(), saga(), rehydrate()]);
      },
      context,
      reducer
    );
  });

  test("can cancel as part of resourceApiCalls", async () => {
    // This test prevents a regression of an issue that required us to revert a change to the API.
    // See https://github.com/Howdju/howdju/commit/7aaa36b7175899c4e81af57118e88b82d1983782 where
    // setting controller.abort directly on the promise resulted in the error:
    // `TypeError: 'abort' called on an object that is not a valid instance of AbortController.`
    // because redux-saga was overriding the `this` value of the call, but axios doesn't like that.

    // Arrange
    const propositions = [
      { id: 1, text: "The first proposition." },
      { id: 2, text: "The second proposition." },
    ];
    server.use(
      rest.get("http://localhost/search-propositions", (_req, res, ctx) => {
        // delay so that we can cancel the request.
        return res(ctx.delay(500), ctx.json({ propositions }));
      })
    );

    const suggestionsKey = "the-suggestions-key";
    function* saga() {
      // Arrange

      // Start the saga that watches for API calls. The error only occurred when callApiForResource
      // was called by another saga.
      const task = yield* fork(resourceApiCalls);

      // Send an API call
      yield* put(
        api.fetchPropositionTextSuggestions(
          "the proposition text",
          suggestionsKey
        )
      );

      // Act

      // Send another API call before the other will finish. Another test ensures that this will
      // cancel the first call.
      yield* put(
        api.fetchPropositionTextSuggestions(
          "the proposition text",
          suggestionsKey
        )
      );

      // Cancel because takeEvery will never end.
      task.cancel();
    }

    await expect(
      testSaga(
        function* () {
          yield all([flagRehydrate(), saga(), rehydrate()]);
        },
        context,
        reducer
      )
    ).toResolve();
  });
});
