import React from "react";
import { screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { rest } from "msw";
import { merge } from "lodash";

import {
  CreateJustification,
  CreateProposition,
  httpStatusCodes,
  JustificationOut,
} from "howdju-common";

import {
  ariaVisibleOne,
  makeRouteComponentProps,
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
  withMockServer,
} from "@/testUtils";
import CreatePropositionPage from "./CreatePropositionPage";
import { pathToRegexp } from "path-to-regexp";
import { InferResponseBody, serviceRoutes } from "howdju-service-routes";

withFakeTimers();
const server = withMockServer();

describe("CreatePropositionPage", () => {
  test("renders correctly with query params", () => {
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

  test("can add URL while editing a WritQuote-based justification", async () => {
    // Arrange
    const user = setupUserEvent();

    const history = createMemoryHistory();
    const { location, match } = makeRouteComponentProps("submit");

    const { container } = renderWithProviders(
      <CreatePropositionPage
        mode={"CREATE_PROPOSITION"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );
    await user.click(
      screen.getByRole("checkbox", { name: /create justification/i })
    );
    await user.click(
      screen.getByRole("radio", { name: /An external reference/i })
    );

    // Act
    await user.click(screen.getByRole("button", { name: /add url/i }));

    // Assert
    expect(await screen.findAllByLabelText(/url/)).toHaveLength(2);

    jest.runAllTimers();
    expect(container).toMatchSnapshot();
  });

  test("can submit a proposition justified via query params", async () => {
    // Arrange
    const user = setupUserEvent();

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
    };

    const response: InferResponseBody<
      typeof serviceRoutes.createJustification
    > = {
      isExtant: false,
      justification: merge({}, justification, {
        id: "1582",
        target: { entity: { id: "9483" } },
        basis: { entity: { id: "910" } },
        rootTargetType: "PROPOSITION",
        rootTarget: { id: "9483" },
      }) as JustificationOut,
    };
    let requestBody;
    server.use(
      rest.post(`http://localhost/justifications`, async (req, res, ctx) => {
        requestBody = await req.json();
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
  test("removing a tag removes it", async () => {
    // Arrange
    const user = setupUserEvent();

    const history = createMemoryHistory();
    const { location, match } = makeRouteComponentProps("submit");

    renderWithProviders(
      <CreatePropositionPage
        mode={"CREATE_PROPOSITION"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );

    const tagName = "TestTag";
    await user.type(screen.getByLabelText(/tag/i), tagName);
    await user.type(screen.getByLabelText(/tag/i), "{Enter}");

    // Act
    await user.click(document.querySelector(".remove-chip-icon") as Element);

    // Assert
    jest.runAllTimers();
    expect(
      screen.queryByRole("button", { name: new RegExp(tagName) })
    ).not.toBeInTheDocument();
  });
  test("attempting to submit with an invalid form shows errors", async () => {
    const user = setupUserEvent();

    const history = createMemoryHistory();
    const { location, match } = makeRouteComponentProps("submit");

    renderWithProviders(
      <CreatePropositionPage
        mode={"CREATE_PROPOSITION"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );

    const tagName = "TestTag";
    await user.type(screen.getByLabelText(/tag/i), tagName);
    await user.type(screen.getByLabelText(/tag/i), "{Enter}");

    // Act
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Assert
    screen
      .getAllByText("String must contain at least 1 character(s)")
      .forEach((el) => expect(el).toBeInTheDocument());
  });
});
