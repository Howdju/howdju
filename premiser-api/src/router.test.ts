import { mockLogger } from "howdju-test-common";
import { httpMethods } from "howdju-common";

import { selectRoute } from "./router";
import { ServicesProvider } from "howdju-service-common";
import { Request } from "./types";

const mockAppProvider = {
  logger: mockLogger,
} as ServicesProvider;

const clientIdentifiers = {
  sessionStorageId: undefined,
  pageLoadId: undefined,
};

describe("routes", () => {
  test("readProposition route path should match a proposition path", () => {
    const path = "propositions/2";
    const method = httpMethods.GET;
    const queryStringParameters = {};

    const { route, routedRequest } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParameters,
    } as Request);

    expect(route.id).toBe("readProposition");
    expect(routedRequest.pathParameters).toEqual(["2"]);
  });

  test("readPropositionJustifications route path should match a proposition justifications path", () => {
    const path = "propositions/2";
    const method = httpMethods.GET;
    const queryStringParameters = { include: "justifications" };

    const { route, routedRequest } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParameters,
      authToken: undefined,
      body: {},
      requestIdentifiers: {},
      clientIdentifiers,
    });
    expect(route.id).toBe("readPropositionJustifications");
    expect(routedRequest.pathParameters).toEqual(["2"]);
  });

  test("readTaggedPropositions route path should match a tagged propositions path", () => {
    const path = "propositions";
    const method = httpMethods.GET;
    const queryStringParameters = { tagId: "42" };

    const { route } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParameters,
      authToken: undefined,
      body: {},
      requestIdentifiers: {},
      clientIdentifiers,
    });

    expect(route.id).toBe("readTaggedPropositions");
  });

  test("readTaggedPropositions route path should NOT match a non-tagged propositions path", () => {
    const path = "propositions";
    const method = httpMethods.GET;
    const queryStringParameters = { tag: "42" };

    const { route } = selectRoute(mockAppProvider, {
      path,
      method,
      queryStringParameters,
      requestIdentifiers: {},
      clientIdentifiers,
      authToken: undefined,
      body: {},
    });
    expect(route.id).not.toBe("readTaggedPropositions");
  });
});
