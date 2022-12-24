import React from "react";
import { rest } from "msw";
import { screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { createMemoryHistory } from "history";

import {
  GetPropositionResponse,
  httpStatusCodes,
  JustificationOut,
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
});
afterAll(() => server.close());

describe("JustificationsPage", () => {
  test("Shows a justified proposition", async () => {
    // Arrange
    const justifications: JustificationOut[] = [];
    const proposition = {
      id: "1",
      text: "the-proposition-text",
      justifications,
    };
    const response: GetPropositionResponse = { proposition };

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
