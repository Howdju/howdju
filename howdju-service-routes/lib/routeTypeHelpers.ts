import { z } from "zod";

import { Body, PathParams, QueryStringParams, ServiceRoute } from "./routes";

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
