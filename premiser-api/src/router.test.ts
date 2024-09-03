import { toPairs } from "lodash";

import { mockLogger } from "howdju-test-common";
import { ServiceRoute, serviceRoutes } from "howdju-service-routes";
import { AppProvider } from "howdju-service-common";
import {
  httpMethods,
  httpStatusCodes,
  StatementOut,
  UpdatePersorg,
} from "howdju-common";

import { routeRequest, selectRoute } from "./router";
import { Request } from "./types";
import moment from "moment";

const mockAppProvider = {
  logger: mockLogger,
} as AppProvider;

const clientIdentifiers = {
  sessionStorageId: undefined,
  pageLoadId: undefined,
};

const serviceRoutePairs = toPairs(serviceRoutes);
function routeId(route: ServiceRoute) {
  return serviceRoutePairs.find((r) => r[1] === route)?.[0];
}

describe("routeRequest", () => {
  test("correctly routes a request with path params", async () => {
    // Arrange
    const callback = jest.fn();
    const proposition = { text: "I'm a proposition" };
    const readPropositionForId = jest.fn().mockReturnValue(proposition);
    const appProvider = {
      propositionsService: { readPropositionForId },
      logger: mockLogger,
    } as unknown as AppProvider;
    const authToken = "the-auth-token";
    const propositionId = "56";
    const request: Request = {
      requestIdentifiers: {},
      clientIdentifiers: { sessionStorageId: undefined, pageLoadId: undefined },
      authToken,
      path: `propositions/${propositionId}`,
      method: "GET",
      queryStringParams: {},
      body: {},
    };

    // Act
    await routeRequest(request, appProvider, callback);

    // Assert
    expect(readPropositionForId).toHaveBeenCalledWith(propositionId, {
      authToken,
    });
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        httpStatusCode: httpStatusCodes.OK,
        body: { proposition },
      })
    );
  });
  test("correctly routes a request with query string params", async () => {
    // Arrange
    const callback = jest.fn();
    const creator = {
      id: "52",
      longName: "The creator",
    };
    const proposition = {
      id: "42",
      text: "Hi they said me.",
      normalText: "Hi they said me.",
      created: moment(),
    };
    const statements: StatementOut[] = [
      {
        id: "92",
        speaker: {
          id: "92",
          isOrganization: false,
          name: "VIP",
          created: moment(),
          creatorUserId: "52",
        },
        sentenceType: "PROPOSITION",
        sentence: proposition,
        created: moment(),
        creator,
      },
    ];
    const readStatementsForSentenceTypeAndId = jest
      .fn()
      .mockReturnValue(statements);
    const appProvider = {
      statementsService: { readStatementsForSentenceTypeAndId },
      logger: mockLogger,
    } as unknown as AppProvider;
    const authToken = "the-auth-token";
    const sentenceType = "PROPOSITION";
    const sentenceId = "42";
    const request: Request = {
      requestIdentifiers: {},
      clientIdentifiers: { sessionStorageId: undefined, pageLoadId: undefined },
      authToken,
      path: `statements`,
      method: "GET",
      queryStringParams: { sentenceType, sentenceId },
      body: {},
    };

    // Act
    await routeRequest(request, appProvider, callback);

    // Assert
    expect(readStatementsForSentenceTypeAndId).toHaveBeenCalledWith(
      sentenceType,
      sentenceId
    );
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        httpStatusCode: httpStatusCodes.OK,
        body: { statements },
      })
    );
  });
  test("correctly routes a request with body", async () => {
    // Arrange
    const callback = jest.fn();
    const persorg: UpdatePersorg = {
      id: "92",
      isOrganization: false,
      name: "VIP",
    };
    const update = jest.fn().mockReturnValue(persorg);
    const userId = 54;
    const appProvider = {
      persorgsService: { update },
      authService: {
        readUserIdForAuthToken: jest.fn().mockReturnValue(userId),
      },
      logger: mockLogger,
    } as unknown as AppProvider;
    const authToken = "the-auth-token";
    const request: Request = {
      requestIdentifiers: {},
      clientIdentifiers: { sessionStorageId: undefined, pageLoadId: undefined },
      authToken,
      queryStringParams: {},
      path: `persorgs/${persorg.id}`,
      method: "PUT",
      body: { persorg },
    };

    // Act
    await routeRequest(request, appProvider, callback);

    // Assert
    expect(update).toHaveBeenCalledWith(persorg, authToken);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        httpStatusCode: httpStatusCodes.OK,
        body: { persorg },
      })
    );
  });
});

describe("selectRoute", () => {
  test("readProposition route path should match a proposition path", () => {
    const path = "propositions/2";
    const method = httpMethods.GET;
    const queryStringParams = {};

    const { route, routedRequest } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParams,
    } as Request);

    expect(routeId(route)).toBe("readProposition");
    expect(routedRequest.pathParams).toEqual({ propositionId: "2" });
  });

  test("readPropositionJustifications route path should match a proposition justifications path", () => {
    const path = "propositions/2";
    const method = httpMethods.GET;
    const queryStringParams = { include: "justifications" };

    const { route, routedRequest } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParams,
      authToken: undefined,
      body: {},
      requestIdentifiers: {},
      clientIdentifiers,
    });

    expect(routeId(route)).toBe("readPropositionJustifications");
    expect(routedRequest.pathParams).toEqual({ propositionId: "2" });
  });

  test("readTaggedPropositions route path should match a tagged propositions path", () => {
    const path = "propositions";
    const method = httpMethods.GET;
    const queryStringParams = { tagId: "42" };

    const { route } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParams,
      authToken: undefined,
      body: {},
      requestIdentifiers: {},
      clientIdentifiers,
    });

    expect(routeId(route)).toBe("readTaggedPropositions");
  });

  test("readTaggedPropositions route path should NOT match a non-tagged propositions path", () => {
    const path = "propositions";
    const method = httpMethods.GET;
    const queryStringParams = { tag: "42" };

    const { route } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParams,
      requestIdentifiers: {},
      clientIdentifiers,
      authToken: undefined,
      body: {},
    });

    expect(routeId(route)).not.toBe("readTaggedPropositions");
  });
});
