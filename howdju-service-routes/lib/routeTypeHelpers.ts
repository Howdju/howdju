import { z } from "zod";

import { ServiceRoute } from "./routes";
import { Body, PathParams, QueryStringParams } from "./routeSchemas";

/** Extracts the path params from a route. */
export type InferPathParams<Route extends ServiceRoute> = z.infer<
  Route["request"]["schema"]
> extends PathParams<infer T>
  ? T
  : never;

/** Extracts the query string params from a route. */
export type InferQueryStringParams<Route extends ServiceRoute> = z.infer<
  Route["request"]["schema"]
> extends QueryStringParams<infer T>
  ? T
  : never;

/** Extracts the request body from a route. */
export type InferRequestBody<Route extends ServiceRoute> = z.infer<
  Route["request"]["schema"]
> extends Body<infer T>
  ? T
  : never;

export type InferResponseReturnType<Route extends ServiceRoute> = Awaited<
  ReturnType<Route["request"]["handler"]>
>;

export type InferResponseBody<Route extends ServiceRoute> =
  InferResponseReturnType<Route> extends Record<string, any>
    ? InferResponseReturnType<Route>["body"]
    : never;
