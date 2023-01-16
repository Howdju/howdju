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

import {
  makeRouteComponentProps,
  renderWithProviders,
  withFakeTimers,
} from "@/testUtils";
import JustificationsPage from "./JustificationsPage";

const server = setupServer();

withFakeTimers();

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

const created = moment("2023-01-12T08:23:00");

describe("JustificationsPage", () => {
  let fromNow: typeof moment.fn.fromNow;
  beforeEach(() => {
    fromNow = moment.fn.fromNow;
    // Use deterministic time for relative time formatting
    moment.fn.fromNow = jest.fn(function (this: Moment) {
      const withoutSuffix = false;
      return this.from(moment("2023-01-12T20:14:00"), withoutSuffix);
    });
  });
  afterEach(() => {
    moment.fn.fromNow = fromNow;
  });

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
