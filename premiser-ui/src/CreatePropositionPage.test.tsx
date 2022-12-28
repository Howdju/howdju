import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "history";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { merge } from "lodash";

import {
  CreateJustification,
  CreateProposition,
  httpStatusCodes,
  Justification,
  Persisted,
  PostJustificationIn,
  PostJustificationOut,
} from "howdju-common";

import {
  ariaVisibleOne,
  makeRouteComponentProps,
  renderWithProviders,
} from "@/testUtils";
import CreatePropositionPage from "./CreatePropositionPage";
import { pathToRegexp } from "path-to-regexp";

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

describe("CreatePropositionPage", () => {
  test("renders correctly with query params", async () => {
    // Arrange
    const description = "A credible source";
    const quoteText = "An important conclusion.";
    const url = "https://www.info.com";

    const history = createMemoryHistory();
    const { location, match } = makeRouteComponentProps("submit", {
      searchParams: {
        description,
        quoteText,
        url,
      },
    });

    // Act
    const { container } = renderWithProviders(
      <CreatePropositionPage
        mode={"SUBMIT_JUSTIFICATION_VIA_QUERY_STRING"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );

    // Assert
    expect(
      ariaVisibleOne(screen.getAllByDisplayValue(description))
    ).toBeInTheDocument();
    expect(
      ariaVisibleOne(screen.getAllByDisplayValue(quoteText))
    ).toBeInTheDocument();
    expect(
      ariaVisibleOne(screen.getAllByDisplayValue(url))
    ).toBeInTheDocument();
    jest.runAllTimers();
    expect(container).toMatchSnapshot();
  });
  test("can submit a proposition justified via query params", async () => {
    // Arrange
    // userEvent delays between actions, so make sure it advances the fake timers.
    // (https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841)
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    const description = "A credible source";
    const quoteText = "An important conclusion.";
    const url = "https://www.info.com";

    const history = createMemoryHistory();
    const { location, match } = makeRouteComponentProps("submit", {
      searchParams: {
        description,
        quoteText,
        url,
      },
    });

    renderWithProviders(
      <CreatePropositionPage
        mode={"SUBMIT_JUSTIFICATION_VIA_QUERY_STRING"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );

    const proposition: CreateProposition = {
      text: "A bonny wee proposition.",
    };
    const justification: CreateJustification = {
      target: {
        type: "PROPOSITION",
        entity: proposition,
      },
      polarity: "POSITIVE",
      basis: {
        type: "WRIT_QUOTE",
        entity: {
          quoteText,
          writ: {
            title: description,
          },
          urls: [{ url }],
        },
      },
      rootPolarity: "POSITIVE",
    };

    const response: PostJustificationOut = {
      justification: merge({}, justification, {
        id: "1582",
        target: { entity: { id: "9483" } },
        basis: { entity: { id: "910" } },
        rootTargetType: "PROPOSITION",
        rootTarget: { id: "9483" },
      }) as Persisted<Justification>,
    };
    let requestBody: PostJustificationIn = {} as PostJustificationIn;
    server.use(
      rest.post(`http://localhost/justifications`, async (req, res, ctx) => {
        requestBody = (await req.json()) as PostJustificationIn;
        return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
      }),
      rest.get("http://localhost/search-propositions", (_req, res, ctx) => {
        // delay so that we can cancel the request.
        return res(ctx.delay(1), ctx.json([]));
      })
    );
    // Use click/keyboard instead of type to trigger autocompletes.
    await user.click(screen.getByLabelText(/text/i));
    for (const letter of proposition.text) {
      await user.keyboard(letter);
      // Run timers in between keystrokes to allow sagas to run?
      jest.runAllTimers();
    }

    // Act
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Assert
    jest.runAllTimers();
    expect(requestBody).toMatchObject({
      justification,
    });
    // TODO(196): get path pattern from routesById instead.
    expect(history.location.pathname).toMatch(pathToRegexp("/p/:id"));
  });
});