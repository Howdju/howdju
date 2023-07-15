import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { rest } from "msw";
import { merge } from "lodash";

import {
  brandedParse,
  CreateMediaExcerpt,
  httpStatusCodes,
  MediaExcerptRef,
} from "howdju-common";
import { InferResponseBody, serviceRoutes } from "howdju-service-routes";

import {
  makeRouteComponentProps,
  renderWithProviders,
  setupUserEvent,
  withFakeTimers,
  withMockServer,
} from "@/testUtils";
import SubmitMediaExcerptPage from "./SubmitMediaExcerptPage";
import { pathToRegexp } from "path-to-regexp";

const server = withMockServer();
withFakeTimers();

describe("SubmitMediaExcerptPage", () => {
  test("can submit a MediaExcerpt populated with query params", async () => {
    // Arrange
    const user = setupUserEvent();

    const quotation = "An important conclusion.";
    const description = "A credible source";
    const url = "https://www.info.com";

    const { location } = makeRouteComponentProps("media-excerpts/new", {
      searchParams: {
        description,
        quotation,
        url,
      },
    });
    const history = createMemoryHistory({ initialEntries: [location] });

    renderWithProviders(<SubmitMediaExcerptPage />, {
      history,
    });

    const mediaExcerpt: CreateMediaExcerpt = {
      localRep: {
        quotation,
      },
      locators: {
        urlLocators: [{ url: { url } }],
      },
      citations: [
        {
          source: {
            description: description,
          },
        },
      ],
    };

    const response: InferResponseBody<typeof serviceRoutes.createMediaExcerpt> =
      {
        isExtant: false,
        mediaExcerpt: merge(
          {},
          mediaExcerpt,
          brandedParse(MediaExcerptRef, {
            id: "1582",
            locators: {
              urlLocators: [{ url: { id: "1583" } }],
            },
            citations: [{ source: { id: "1584" } }],
          })
        ),
      };
    let requestBody: CreateMediaExcerpt | undefined;
    server.use(
      rest.post(`http://localhost/media-excerpts`, async (req, res, ctx) => {
        requestBody = await req.json();
        return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
      }),
      rest.get("http://localhost/search-sources", (_req, res, ctx) => {
        // delay so that we can cancel the request.
        return res(ctx.delay(1), ctx.json([]));
      })
    );

    // Act
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Assert
    jest.runAllTimers();
    await waitFor(() => {
      expect(requestBody).toMatchObject({
        mediaExcerpt,
      });
    });
    // TODO(196): get path pattern from routesById instead.
    expect(history.location.pathname).toMatch(
      pathToRegexp("/media-excerpts/:id")
    );
  });

  // TODO(464) address slow userEvent.type for source description
  const MEDIA_EXCERPT_SUBMIT_TEST_TIMEOUT = 7500;
  test(
    "can submit a MediaExcept entered by input",
    async () => {
      // Arrange
      const user = setupUserEvent();

      const quotation = "An important conclusion.";
      const url = "https://www.info.com";
      const description = "A credible source";
      const pincite = "page 123";

      const { location } = makeRouteComponentProps("media-excerpts/new");
      const history = createMemoryHistory({ initialEntries: [location] });

      renderWithProviders(<SubmitMediaExcerptPage />, {
        history,
      });

      const mediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation,
        },
        locators: {
          urlLocators: [{ url: { url } }],
        },
        citations: [
          {
            source: {
              description,
            },
            pincite,
          },
        ],
      };

      const response: InferResponseBody<
        typeof serviceRoutes.createMediaExcerpt
      > = {
        isExtant: false,
        mediaExcerpt: merge(
          {},
          mediaExcerpt,
          brandedParse(MediaExcerptRef, {
            id: "1582",
            citations: [{ source: { id: "1584" } }],
          })
        ),
      };
      let requestBody: CreateMediaExcerpt | undefined;
      server.use(
        rest.post(`http://localhost/media-excerpts`, async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
        }),
        rest.get("http://localhost/search-sources", (_req, res, ctx) => {
          // delay so that we can cancel the request.
          return res(ctx.delay(1), ctx.json([]));
        })
      );

      await user.type(screen.getByLabelText(/Quote/i), quotation);
      await user.type(screen.getByLabelText(/URL/i), url);
      await user.type(screen.getByLabelText(/Description/i), description);
      await user.type(screen.getByLabelText(/Pincite/i), pincite);

      // Act
      await user.click(screen.getByRole("button", { name: /create/i }));

      // Assert
      jest.runAllTimers();
      await waitFor(() => {
        expect(requestBody).toMatchObject({
          mediaExcerpt,
        });
      });
      // TODO(196): get path pattern from routesById instead.
      expect(history.location.pathname).toMatch(
        pathToRegexp("/media-excerpts/:id")
      );
    },
    MEDIA_EXCERPT_SUBMIT_TEST_TIMEOUT
  );
});
