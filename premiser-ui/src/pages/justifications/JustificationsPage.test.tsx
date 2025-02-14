import React from "react";
import { rest } from "msw";
import { screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import moment from "moment";
import { merge } from "lodash";

import {
  CreateJustification,
  httpStatusCodes,
  JustificationOut,
  toSlug,
  utcNow,
} from "howdju-common";
import {
  InferRequestBody,
  InferResponseBody,
  serviceRoutes,
} from "howdju-service-routes";
import { withFakeTimers } from "howdju-test-common";
import { withMockServer } from "howdju-client-test-common";

import {
  clickEnabledButton,
  makeRouteComponentProps,
  renderWithProviders,
  setupUserEvent,
} from "@/testUtils";
import JustificationsPage from "./JustificationsPage";

withFakeTimers({ now: new Date("2023-01-12T16:44:00-08:00") });
const server = withMockServer();

const created = moment("2023-01-12T08:23:12-08:00");

describe("JustificationsPage", () => {
  test("Shows a justified proposition", async () => {
    // Arrange
    const justifications: JustificationOut[] = [];
    const proposition = {
      id: "1",
      created,
      text: "the-proposition-text",
      normalText: "the-proposition-text",
      justifications,
      tags: [],
      recommendedTags: [],
      propositionTagVotes: [],
    };
    const response: InferResponseBody<typeof serviceRoutes.readProposition> = {
      proposition,
    };

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

  test("Can edit a proposition root target", async () => {
    // Arrange
    const user = setupUserEvent();

    const justifications: JustificationOut[] = [];
    const proposition = {
      id: "1",
      created,
      text: "the-proposition-text",
      normalText: "the-proposition-text",
      justifications,
      tags: [],
      recommendedTags: [],
      propositionTagVotes: [],
    };
    const response: InferResponseBody<typeof serviceRoutes.readProposition> = {
      proposition,
    };

    server.use(
      rest.get(
        `http://localhost/propositions/${proposition.id}`,
        (_req, res, ctx) => {
          return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
        }
      ),
      rest.get(`http://localhost/search-propositions`, (_req, res, ctx) => {
        const response: InferResponseBody<
          typeof serviceRoutes.searchPropositions
        > = { propositions: [] };
        return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
      }),
      rest.put(
        `http://localhost/propositions/${proposition.id}`,
        async (req, res, ctx) => {
          const { proposition } = await req.json<
            InferRequestBody<typeof serviceRoutes.updateProposition>
          >();
          const response: InferResponseBody<
            typeof serviceRoutes.updateProposition
          > = {
            proposition: {
              ...proposition,
              normalText: proposition.text,
              creator: proposition.creator,
              created: utcNow(),
            },
          };
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

    renderWithProviders(
      <JustificationsPage
        rootTargetType={"PROPOSITION"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );
    const updatedText = "The updated text";

    // Act
    await user.click(screen.getByRole("button", { description: "Actions" }));
    await user.click(screen.getByRole("button", { name: /Edit/i }));
    const propositionTextInput = screen.getByLabelText(/Text/i);
    await user.clear(propositionTextInput);
    await user.type(propositionTextInput, updatedText);
    await clickEnabledButton(user, "Save");

    // Assert
    jest.runAllTimers();
    expect(
      await screen.findByText(updatedText, { ignore: '[aria-hidden="true"]' })
    ).toBeInTheDocument();
  });

  test("can add a compound-based justification", async () => {
    // Arrange
    const user = setupUserEvent();
    const justifications: JustificationOut[] = [];
    const rootTargetId = "1";
    const proposition = {
      id: rootTargetId,
      created,
      text: "the-proposition-text",
      normalText: "the-proposition-text",
      justifications,
      tags: [],
      recommendedTags: [],
      propositionTagVotes: [],
    };

    const basisText1 = "The proposition text 1";
    const basisText2 = "The proposition text 2";
    const justification: CreateJustification = {
      target: {
        type: "PROPOSITION",
        entity: proposition,
      },
      polarity: "POSITIVE",
      basis: {
        type: "PROPOSITION_COMPOUND",
        entity: {
          atoms: [
            { entity: { text: basisText1 } },
            { entity: { text: basisText2 } },
          ],
        },
      },
    };
    server.use(
      rest.get(
        `http://localhost/propositions/${proposition.id}`,
        (_req, res, ctx) => {
          const response: InferResponseBody<
            typeof serviceRoutes.readProposition
          > = {
            proposition,
          };
          return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
        }
      ),
      rest.get(`http://localhost/search-propositions`, (_req, res, ctx) => {
        const response: InferResponseBody<
          typeof serviceRoutes.searchPropositions
        > = { propositions: [] };
        return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
      }),
      rest.post(`http://localhost/justifications`, async (_req, res, ctx) => {
        const response: InferResponseBody<
          typeof serviceRoutes.createJustification
        > = {
          isExtant: false,
          justification: merge({}, justification, {
            id: "1582",
            target: { entity: { id: rootTargetId } },
            basis: {
              entity: {
                id: "910",
                atoms: [{ entity: { id: "911" } }, { entity: { id: "912" } }],
              },
            },
            rootTargetType: "PROPOSITION",
            rootTarget: { id: rootTargetId },
          }) as JustificationOut,
        };
        return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
      })
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

    const { container } = renderWithProviders(
      <JustificationsPage
        rootTargetType={"PROPOSITION"}
        history={history}
        location={location}
        match={match}
      />,
      { history }
    );

    // Act
    await user.click(screen.getByRole("button", { name: /Add one now/i }));
    await user.type(screen.getByLabelText(/Text/i), basisText1);
    await user.click(screen.getByRole("button", { description: /add atom/i }));
    await user.type(screen.getAllByLabelText(/Text/i)[1], basisText2);
    await clickEnabledButton(user, /Create/i);

    // Assert
    jest.runAllTimers();
    expect(await screen.findByText(basisText1)).toBeInTheDocument();
    expect(await screen.findByText(basisText2)).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });
});
