import React from "react";
import { rest } from "msw";
import { screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { createMemoryHistory } from "history";
import moment, { Moment } from "moment";

import {
  GetPropositionOut,
  httpStatusCodes,
  JustificationOut,
  PropositionRef,
  toSlug,
} from "howdju-common";

import { makeRouteComponentProps, renderWithProviders } from "@/testUtils";
import JustificationsPage from "./JustificationsPage";

const server = setupServer();

beforeAll(() => {
  server.listen();

  // Use fake timers so that we can ensure animations complete before snapshotting.
  jest.useFakeTimers();
});
afterEach(() => {
  server.resetHandlers();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
afterAll(() => server.close());

const created = moment("2023-01-12T08:23:00");
// Use deterministic time for relative time formatting
moment.fn.fromNow = jest.fn(function (this: Moment) {
  const withoutSuffix = false;
  return this.from(moment("2023-01-12T20:14:00"), withoutSuffix);
});

describe("JustificationsPage", () => {
  test("Shows a justified proposition", async () => {
    // Arrange
    const justifications: JustificationOut[] = [];
    const proposition = {
      ...PropositionRef.parse({ id: "1" }),
      created,
      text: "the-proposition-text",
      justifications,
    };
    const response: GetPropositionOut = { proposition };

    server.use(
      rest.get(
        `http://localhost/propositions/${proposition.id}`,
        (_req, res, ctx) => {
          return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
        }
      )
    );

    const history = createMemoryHistory();
    const { location, match } = makeRouteComponentProps(
      // TODO(196) convert routesById to routePropsById so that we can get path like `routesById["proposition"].path`
      "p/:rootTargetId/:slug",
      {
        pathParams: {
          rootTargetId: proposition.id,
          slug: toSlug(proposition.text),
        },
      }
    );

    // Act
    const { container } = renderWithProviders(
      <JustificationsPage
        rootTargetType={"PROPOSITION"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );

    // Assert
    expect(await screen.findByText(proposition.text)).toBeInTheDocument();
    jest.runAllTimers();
    expect(container).toMatchSnapshot();
  });
});
