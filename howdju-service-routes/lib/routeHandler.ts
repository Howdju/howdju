import { z } from "zod";

import { AuthRefreshToken, AuthToken } from "howdju-common";
import { AppProvider, Cookie } from "howdju-service-common";

interface CommonRequest {
  // Any request may include authToken, and handlers may use it to customize the response for the
  // user. Use Authed to require the authToken.
  authToken: AuthToken | undefined;
  authRefreshToken: AuthRefreshToken | undefined;
}

export interface HandlerResult {
  body?: Record<string, any>;
  headers?: Record<string, string>;
  cookies?: [Cookie];
}

/**
 * Creates a service request handler that validates the request and delegates to an impl.
 *
 * This helper also helps with type inference from the validation schema to the impl.
 *
 * @param schema The request validation schema
 * @param impl The request handler implementation
 * @typeparam T the request's type
 * @typeparam R the response's type.
 * @returns A promise of the response
 */
export function handler<
  S extends z.ZodType<T, z.ZodTypeDef>,
  R extends HandlerResult | void,
  T = InferRequest<S>
>(
  schema: S,
  handler: (provider: AppProvider, request: T & CommonRequest) => Promise<R>
) {
  return {
    schema,
    handler,
  };
}

type InferRequest<Schema> = Schema extends z.ZodType<infer T, z.ZodTypeDef>
  ? T
  : never;
