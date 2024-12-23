import React from "react";
import { rest } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { drop, take, toNumber } from "lodash";
import moment from "moment";

import { httpStatusCodes, fromJson, toJson } from "howdju-common";
import { InferResponseBody, serviceRoutes } from "howdju-service-routes";
import { withFakeTimers } from "howdju-test-common";
import { withMockServer } from "howdju-client-test-common";

import RecentPropositionsWidget from "@/pages/recentActivity/RecentPropositionsWidget";
import { renderWithProviders, setupUserEvent } from "@/testUtils";

const REACT_MD_CARD_CLASS = ".rmd-card";

withFakeTimers({ now: new Date("2023-01-12T16:44:00-08:00") });
const server = withMockServer();

const created = moment("2023-01-12T12:23:00-08:00");
const propositions = Array.from(Array(20).keys()).map((id) => ({
  id: `proposition${id}`,
  created,
  text: `The proposition text ${id}`,
  normalText: `The proposition text ${id}`,
}));
const initialFetchCount = 7;
const fetchCount = 8;

beforeEach(() => {
  server.use(
    rest.get("http://localhost/propositions", (req, res, ctx) => {
      const count = toNumber(req.url.searchParams.get("count"));
      const continuationTokenIn = req.url.searchParams.get("continuationToken");
      const offset = continuationTokenIn
        ? toNumber(fromJson(continuationTokenIn))
        : 0;
      const continuationToken = toJson(offset + count);
      const response: InferResponseBody<typeof serviceRoutes.readPropositions> =
        {
          propositions: take(drop(propositions, offset), count),
          continuationToken,
        };
      return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
    })
  );
});

describe("ListEntitiesWidget", () => {
  describe("RecentPropositionsWidget", () => {
    test("shows initial recent propositions", async () => {
      // Act
      const { container } = renderWithProviders(
        <RecentPropositionsWidget
          id="recent-propositions-id"
          widgetId="recent-propositions-widget-id"
          initialFetchCount={initialFetchCount}
          fetchCount={fetchCount}
        />
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      });

      expect(container.querySelectorAll(REACT_MD_CARD_CLASS)).toHaveLength(
        initialFetchCount
      );
      jest.runAllTimers();
      expect(container).toMatchSnapshot();
    });

    test("shows more propositions when more is clicked", async () => {
      // Arrange
      const { container } = renderWithProviders(
        <RecentPropositionsWidget
          id="recent-propositions-id"
          widgetId="recent-propositions-widget-id"
          initialFetchCount={initialFetchCount}
          fetchCount={fetchCount}
        />
      );
      await waitFor(() => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      });

      const user = setupUserEvent();

      // Act
      await user.click(
        screen.getByRole("button", {
          name: /fetch more/i,
        })
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      });
      jest.runAllTimers();
      expect(container.querySelectorAll(REACT_MD_CARD_CLASS)).toHaveLength(
        initialFetchCount + fetchCount
      );
      expect(container).toMatchSnapshot();
    });
  });
});
