import React from "react";
import { createMemoryHistory } from "history";
import { rest } from "msw";
import { waitFor } from "@testing-library/react";

import {
  ContextTrailItem,
  ContextTrailItemInfo,
  httpStatusCodes,
  JustificationView,
  serializeContextTrail,
  toJson,
} from "howdju-common";
import { withFakeTimers } from "howdju-test-common";
import { withMockServer } from "howdju-client-test-common";

import { renderWithProviders } from "@/testUtils";
import {
  PrimaryContextTrail,
  PrimaryContextTrailProvider,
} from "./PrimaryContextTrailProvider";

withFakeTimers();
const server = withMockServer();

describe("PrimaryContextTrailProvider", () => {
  test("Provides context trail from query params", async () => {
    const connectingEntityId = "42";
    const contextTrailInfos: ContextTrailItemInfo[] = [
      {
        connectingEntityType: "JUSTIFICATION",
        connectingEntityId,
        polarity: "POSITIVE",
      },
    ];

    const contextTrailItems: ContextTrailItem[] = [
      {
        connectingEntity: {
          id: connectingEntityId,
        } as JustificationView,
        connectingEntityType: "JUSTIFICATION",
        connectingEntityId,
        polarity: "POSITIVE",
      },
    ];

    server.use(
      rest.get(`http://localhost/context-trails`, (_req, res, ctx) => {
        return res(
          ctx.status(httpStatusCodes.OK),
          ctx.json({ contextTrailItems })
        );
      })
    );

    const history = createMemoryHistory({
      initialEntries: [
        `/any-path?context-trail=${serializeContextTrail(contextTrailInfos)}`,
      ],
    });

    let contextValue: any;
    function captureContextValue(value: any) {
      contextValue = value;
      return <span>Received: {toJson(value)}</span>;
    }

    // Act
    renderWithProviders(
      <PrimaryContextTrailProvider>
        <PrimaryContextTrail.Consumer>
          {captureContextValue}
        </PrimaryContextTrail.Consumer>
        ,
      </PrimaryContextTrailProvider>,
      { history }
    );

    // Assert
    jest.runAllTimers();
    await waitFor(() =>
      expect(contextValue).toEqual({
        contextTrailInfos,
        contextTrailItems,
        isInvalid: false,
      })
    );
  });
});
