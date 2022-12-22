import React from "react";
import { rest } from "msw";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { setupServer } from "msw/node";
import userEvent from "@testing-library/user-event";

import RecentPropositionsWidget from "./RecentPropositionsWidget";
import { renderWithProviders } from "@/testUtils";
import {
  httpStatusCodes,
  GetPropositionsOut,
  fromJson,
  toJson,
} from "howdju-common";
import { drop, take, toNumber } from "lodash";

const server = setupServer();
const propositions = Array.from(Array(20).keys()).map((id) => ({
  id: "proposition" + id,
  text: "The proposition text " + id,
}));
const initialFetchCount = 7;
const fetchCount = 8;

jest.setTimeout(5 * 60 * 1000);

beforeAll(() => {
  server.listen();
});
beforeEach(() => {
  jest.useFakeTimers();

  server.use(
    rest.get("http://localhost/propositions", (req, res, ctx) => {
      const count = toNumber(req.url.searchParams.get("count"));
      const continuationTokenIn = req.url.searchParams.get("continuationToken");
      const offset = continuationTokenIn ? fromJson(continuationTokenIn) : 0;
      const continuationToken = toJson(offset + count);
      const response: GetPropositionsOut = {
        propositions: take(drop(propositions, offset), count),
        continuationToken,
      };
      return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
    })
  );
});
afterEach(() => {
  server.resetHandlers();

  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
afterAll(() => server.close());

describe("RecentPropositionsWidget", () => {
  test("shows an initial count of recent propositions", async () => {
    // Act
    const { container } = renderWithProviders(
      <RecentPropositionsWidget
        id="the-component-id"
        widgetId="the-recent-propositions-widget"
        initialFetchCount={initialFetchCount}
        fetchCount={fetchCount}
      />
    );

    // Assert
    try {
      await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    } catch (error) {
      // TODO(17): for some reason the progressbar never disappears inside the wait, but is gone
      // after we catch the timeout exception. Maybe upgrading react-md will fix things?
    }
    // TODO(17) update the widgets to be accessible so we can do `screen.findAllByRole("list-item")`
    expect(container.querySelectorAll(".md-card")).toHaveLength(
      initialFetchCount
    );
    jest.runAllTimers();
    expect(container).toMatchSnapshot();
  });

  test("shows more propositions when more is clicked", async () => {
    // Arrange
    const { container } = renderWithProviders(
      <RecentPropositionsWidget
        id="the-component-id"
        widgetId="the-recent-propositions-widget"
        initialFetchCount={initialFetchCount}
        fetchCount={fetchCount}
      />
    );
    try {
      await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    } catch (error) {
      // TODO(17): see above.
    }

    // userEvent delays between actions, so make sure it advances the fake timers.
    // (https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    // Act
    await user.click(
      screen.getByRole("button", {
        name: /fetch more/i,
      })
    );

    // Assert
    try {
      await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    } catch (error) {
      // TODO(17): see above.
    }
    jest.runAllTimers();
    // TODO(17): update the widgets to be accessible so we can do `screen.findAllByRole("list-item")`
    expect(container.querySelectorAll(".md-card")).toHaveLength(
      initialFetchCount + fetchCount
    );
    expect(container).toMatchSnapshot();
  });
});
