import { fork, put } from "typed-redux-saga";
import { setupServer } from "msw/node";
import { rest } from "msw";

import { api } from "@/apiActions";
import { callApiForResource, resourceApiCalls } from "./resourceApiSagas";
import { testSaga } from "@/testUtils";

const server = setupServer();

beforeAll(() => {
  server.listen();

  // Use fake timers so that we can ensure animations complete before snapshotting.
  jest.useFakeTimers();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

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
    await testSaga(function* saga() {
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
    });
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
    await testSaga(function* saga() {
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

      // Assert

      // If we didn't error during the act, the test passes.
      expect(true).toBeTrue();

      // Cancel because takeEvery will never end.
      task.cancel();
    });
  });
});
