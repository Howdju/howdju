import React from "react";
import { rest } from "msw";
import { screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import moment from "moment";

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
  withMockServer,
  withStaticFromNowMoment,
} from "@/testUtils";
import JustificationsPage from "./JustificationsPage";

withFakeTimers();
const server = withMockServer();

const created = moment("2023-01-12T08:23:00");

describe("JustificationsPage", () => {
  withStaticFromNowMoment("2023-01-12T20:14:00");

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
