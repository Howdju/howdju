import React from "react";
import { rest } from "msw";
import { screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { createMemoryHistory } from "history";

import {
  GetPropositionResponse,
  httpStatusCodes,
  JustificationOut,
} from "howdju-common";

import {
  ariaVisibleOne,
  makeRouteComponentProps,
  renderWithProviders,
} from "@/testUtils";
import CreatePropositionPage from "./CreatePropositionPage";

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
});
