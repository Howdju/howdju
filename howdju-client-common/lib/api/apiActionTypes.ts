import { PayloadAction } from "@reduxjs/toolkit";
import { Schema } from "type-fest";
import { schema } from "normalizr";

import { EntityName } from "howdju-common";
import { ServiceRoute, InferResponseReturnType } from "howdju-service-routes";
import type { RequestOptions } from "./api";

export type ApiAction<Route extends ServiceRoute> = PayloadAction<
  ApiCallConfig<Route>
>;
export type AnyApiAction = ApiAction<any>;

export type ApiCallConfig<Route extends ServiceRoute> = {
  endpoint: string;
  /** The schema for normalizing the response entities. */
  normalizationSchema: Schema<
    InferResponseBodyEntities<Route>,
    schema.Entity<any>
  >;
  fetchInit: FetchInit;
  canSkipRehydrate: boolean;
  cancelKey: string;
  /** Optional: whether to log cancelation of the API call. */
  logCancellation?: boolean;
};

export type FetchInit = Omit<RequestOptions, "endpoint">;

/** Return never if the Key doesn't correspond to an entity requiring normalization. */
type ToEntityFieldKey<
  Body extends Record<string, any>,
  Key extends keyof Body
> = Body[Key] extends (infer I)[]
  ? EntityName<I> extends never
    ? never
    : Key
  : EntityName<Body[Key]> extends never
  ? never
  : Key;
type ToNonEntityFieldKey<
  Body extends Record<string, any>,
  Key extends keyof Body
> = Body[Key] extends (infer I)[]
  ? EntityName<I> extends never
    ? Key
    : never
  : EntityName<Body[Key]> extends never
  ? Key
  : never;

/** Require all Body properties that are entities. */
type EntityFieldsOnly<Body extends Record<string, any>> = {
  [K in keyof Body as ToEntityFieldKey<Body, K>]: Body[K];
};
type NonEntityFieldsOnlyOptional<Body extends Record<string, any>> = {
  [K in keyof Body as ToNonEntityFieldKey<Body, K>]+?: Body[K];
};

export type InferResponseBodyEntities<Route extends ServiceRoute> =
  InferResponseReturnType<Route> extends Record<string, any>
    ? EntityFieldsOnly<InferResponseReturnType<Route>["body"]> &
        NonEntityFieldsOnlyOptional<InferResponseReturnType<Route>["body"]>
    : never;
