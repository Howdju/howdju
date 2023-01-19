import React from "react";
import { rest } from "msw";
import { screen, waitFor } from "@testing-library/react";

import RecentPropositionsWidget from "./RecentPropositionsWidget";
import {
  renderWithProviders,
  withFakeTimers,
  withStaticFromNowMoment,
  withMockServer,
  setupUserEvent,
} from "@/testUtils";
import {
  httpStatusCodes,
  GetPropositionsOut,
  fromJson,
  toJson,
  PropositionRef,
} from "howdju-common";
import { drop, take, toNumber } from "lodash";
import moment from "moment";

const created = moment("2023-01-12T12:23:00");

withFakeTimers();

const server = withMockServer();
const propositions = Array.from(Array(20).keys()).map((id) => ({
  ...PropositionRef.parse({ id: `proposition${id}` }),
  created,
  text: `The proposition text ${id}`,
}));
const initialFetchCount = 7;
const fetchCount = 8;

withStaticFromNowMoment("2023-01-12T20:14:00");

beforeEach(() => {
  server.use(
    rest.get("http://localhost/propositions", (req, res, ctx) => {
      const count = toNumber(req.url.searchParams.get("count"));
      const continuationTokenIn = req.url.searchParams.get("continuationToken");
      const offset = continuationTokenIn
        ? toNumber(fromJson(continuationTokenIn))
        : 0;
      const continuationToken = toJson(offset + count);
      const response: GetPropositionsOut = {
        propositions: take(drop(propositions, offset), count),
        continuationToken,
      };
      return res(ctx.status(httpStatusCodes.OK), ctx.json(response));
    })
  );
});

/** Throws if progress is in the document and visible. */
function progressToBeGone(progress: HTMLElement | null) {
  try {
    expect(progress).not.toBeInTheDocument();
  } catch {
    // Sometimes CircularProgress hangs around in the DOM even though it is invisible.
    // TODO(17): Check if this is still necessary after upgrading react-md
    // eslint-disable-next-line jest/no-conditional-expect
    expect(progress).toHaveStyle({ opacity: 0 });
  }
}

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
        progressToBeGone(screen.queryByRole("progressbar"));
      });

      // TODO(17) update the widgets to be accessible so we can do `screen.findAllByRole("list-item")`
      expect(container.querySelectorAll(".md-card")).toHaveLength(
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
        progressToBeGone(screen.queryByRole("progressbar"));
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
        progressToBeGone(screen.queryByRole("progressbar"));
      });
      jest.runAllTimers();
      // TODO(17): update the widgets to be accessible so we can do `screen.findAllByRole("list-item")`
      expect(container.querySelectorAll(".md-card")).toHaveLength(
        initialFetchCount + fetchCount
      );
      expect(container).toMatchSnapshot();
    });
  });
});
