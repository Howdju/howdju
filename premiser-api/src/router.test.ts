import { toPairs } from "lodash";

import { mockLogger } from "howdju-test-common";
import { ServiceRoute, serviceRoutes } from "howdju-service-routes";
import { ServicesProvider } from "howdju-service-common";
import { httpMethods } from "howdju-common";

import { selectRoute } from "./router";
import { Request } from "./types";

const mockAppProvider = {
  logger: mockLogger,
} as ServicesProvider;

const clientIdentifiers = {
  sessionStorageId: undefined,
  pageLoadId: undefined,
};

const serviceRoutePairs = toPairs(serviceRoutes);
function routeId(route: ServiceRoute) {
  return serviceRoutePairs.find((r) => r[1] === route)?.[0];
}

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

    expect(routeId(route)).toBe("readProposition");
    expect(routedRequest.pathParams).toEqual(["2"]);
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

    expect(routeId(route)).toBe("readPropositionJustifications");
    expect(routedRequest.pathParams).toEqual(["2"]);
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

    expect(routeId(route)).toBe("readTaggedPropositions");
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

    expect(routeId(route)).not.toBe("readTaggedPropositions");
  });
});
