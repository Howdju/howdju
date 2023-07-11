import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "history";
import { rest } from "msw";
import { merge } from "lodash";
import moment from "moment";
import { pathToRegexp } from "path-to-regexp";

import {
  brandedParse,
  CreateJustification,
  CreateProposition,
  httpStatusCodes,
  JustificationOut,
  PropositionOut,
  PropositionRef,
} from "howdju-common";
import {
  InferRequestBody,
  InferResponseBody,
  serviceRoutes,
} from "howdju-service-routes";
import { expectToBeSameMomentDeep } from "howdju-test-common";

import {
  ariaVisibleOne,
  getElementByQuerySelector,
  getTextContent,
  makeRouteComponentProps,
  progressToBeGone,
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
  withMockServer,
} from "@/testUtils";
import CreatePropositionPage from "./CreatePropositionPage";

const server = withMockServer();

describe("CreatePropositionPage", () => {
  describe("(with fake timers)", () => {
    withFakeTimers();

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

    test("can submit a proposition justified via WritQuote query params", async () => {
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

    test("can create a MediaExcerpt-based proposition", async () => {
      // Arrange
      const user = setupUserEvent();

      const quotation = "An important quotation.";
      const sourceDescription = `“An insightful article” A Friendly Local Paper (2023-05-26)`;
      const url = "https://www.news-paper.com";
      const speakerName = "A. N. Author";

      const history = createMemoryHistory();
      const { location, match } = makeRouteComponentProps("create-proposition");

      renderWithProviders(
        <CreatePropositionPage
          mode={"CREATE_PROPOSITION"}
          history={history}
          location={location}
          match={match}
        />,
        { history }
      );

      const proposition: CreateProposition = {
        text: "A bonny wee proposition.",
      };
      const createJustification: CreateJustification = {
        target: {
          type: "PROPOSITION",
          entity: proposition,
        },
        polarity: "POSITIVE",
        basis: {
          type: "MEDIA_EXCERPT",
          entity: {
            localRep: {
              quotation,
            },
            locators: { urlLocators: [{ url: { url } }] },
            citations: [{ source: { description: sourceDescription } }],
            speakers: [{ name: speakerName, isOrganization: false }],
          },
        },
      };

      const response: InferResponseBody<
        typeof serviceRoutes.createJustification
      > = {
        isExtant: false,
        justification: merge({}, createJustification, {
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
        }),
        rest.get("http://localhost/search-sources", (_req, res, ctx) => {
          // delay so that we can cancel the request.
          return res(ctx.delay(1), ctx.json([]));
        })
      );

      await user.type(
        getElementByQuerySelector('textarea[name="proposition.text"]'),
        proposition.text
      );
      const mediaExcerptRadio = getElementMatching(
        'input[name="justification.basis.type"]',
        (el) => /media excerpt/i.test(getTextContent(el.parentElement))
      );
      await user.click(mediaExcerptRadio);
      await user.type(
        document.querySelectorAll(".media-excerpt-editor-fields textarea")[0],
        quotation
      );

      await user.click(
        screen.getByRole("button", { name: /add URL locator/i })
      );
      await user.type(screen.getByLabelText(/URL/i), url);

      await user.type(screen.getByLabelText(/description/i), sourceDescription);

      await user.click(
        getElementByQuerySelector(
          '.media-excerpt-editor-fields .speakers [title="Add speaker"]'
        )
      );
      await user.type(screen.getByLabelText(/name/i), speakerName);

      // Act
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      jest.runAllTimers();
      expect(requestBody).toMatchObject({
        justification: createJustification,
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

  describe("(with real timers)", () => {
    test("can submit a Proposition justified by an extant Proposition", async () => {
      // I'm not sure why we need real timers for this test, but what I observe is that
      // fetchAndBeginEditOfNewJustificationFromBasisSource puts the beginEdit, but then the
      // component never re-renders based upon the updated state. I even checked that the reducer
      // was returning an unequal state.

      // Arrange
      const user = userEvent.setup();

      const basisSourceId = "2";
      const basisSourceType = "PROPOSITION";

      const history = createMemoryHistory();
      const { location, match } = makeRouteComponentProps(
        "create-justification",
        {
          searchParams: {
            basisSourceId,
            basisSourceType,
          },
        }
      );

      const proposition: CreateProposition = {
        text: "A bonny wee proposition.",
      };
      const basisProposition: PropositionOut = brandedParse(PropositionRef, {
        id: basisSourceId,
        text: "This warrants a response.",
        created: moment(),
      });
      const justification: CreateJustification = {
        target: {
          type: "PROPOSITION",
          entity: proposition,
        },
        polarity: "POSITIVE",
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: {
            atoms: [{ entity: basisProposition }],
          },
        },
      };

      let requestBody:
        | InferRequestBody<typeof serviceRoutes.createJustification>
        | undefined = undefined;
      server.use(
        rest.post(`http://localhost/justifications`, async (req, res, ctx) => {
          requestBody = await req.json();

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

          return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
        }),
        rest.get("http://localhost/search-propositions", (_req, res, ctx) => {
          // delay so that we can cancel the request.
          return res(ctx.delay(1), ctx.json([]));
        }),
        rest.get(
          `http://localhost/propositions/${basisProposition.id}`,
          (_req, res, ctx) => {
            const response: InferResponseBody<
              typeof serviceRoutes.readProposition
            > = {
              proposition: basisProposition,
            };
            // delay so that we can cancel the request.
            return res(ctx.delay(1), ctx.json(response));
          }
        )
      );

      renderWithProviders(
        <CreatePropositionPage
          mode={"CREATE_JUSTIFICATION"}
          history={history}
          location={location}
          match={match}
        />,
        { history }
      );

      await waitFor(() => {
        progressToBeGone(screen.queryByRole("progressbar"));
      });

      // Use click/keyboard instead of type to trigger autocompletes.
      const targetInput = screen.getAllByLabelText(/text/i)[0];
      await user.click(targetInput);
      for (const letter of proposition.text) {
        await user.keyboard(letter);
      }

      const createButton = screen.getByRole("button", { name: /create/i });
      await waitFor(() =>
        expect(createButton).not.toHaveClass("md-text--disabled")
      );

      // Act
      await user.click(createButton);

      // Assert
      await waitFor(() => expect(requestBody).toBeTruthy());
      expect(requestBody).toMatchObject(
        expectToBeSameMomentDeep({
          justification,
        })
      );
      // TODO(196): get path pattern from routesById instead.
      expect(history.location.pathname).toMatch(pathToRegexp("/p/:id"));
    });
  });
});

function getElementMatching(selector: string, test: (el: Element) => boolean) {
  const el = Array.from(document.querySelectorAll(selector)).find(test);
  if (!el) {
    throw new Error(
      `No element matching ${selector} and passing ${test} found.`
    );
  }
  return el;
}
