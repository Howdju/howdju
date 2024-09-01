import { reduce } from "lodash";
import { z } from "zod";

export const EmptyRequest = z.object({});
export type EmptyRequest = z.output<typeof EmptyRequest>;

/**
 * A request schema mixin for routes requiring an auth token.
 *
 * The API router uses this to reject requests missing an AuthToken.
 *
 * For routes for which an AuthToken is optional, no special request schema is needed; `authToken`
 * will be available if the request provided one.
 */
export const Authed = z.object({
  authToken: z.string(),
});
export type Authed = z.infer<typeof Authed>;

export const AuthRefreshRequest = z.object({
  authRefreshToken: z.string(),
});
export type AuthRefreshRequest = z.infer<typeof AuthRefreshRequest>;

/**
 * A request schema mixin for routes receiving path parameters.
 *
 * TODO(321) infer paramNames from the path.
 */
export const PathParams = function <U extends string, T extends [U, ...U[]]>(
  ...paramNames: T
) {
  const shape = reduce(
    paramNames,
    (acc, p: T[number]) => {
      acc[p] = z.string();
      return acc;
    },
    {} as { [key in T[number]]: z.ZodString }
  );
  return z.object({ pathParams: z.object(shape) });
};
export type PathParams<T extends Record<string, string>> = {
  pathParams: T;
};

export const QueryStringParams = function <
  U extends string,
  T extends [U, ...U[]]
>(...paramNames: T) {
  const shape = reduce(
    paramNames,
    (acc, p: T[number]) => {
      acc[p] = z.string().optional();
      return acc;
    },
    {} as { [key in T[number]]: z.ZodOptional<z.ZodString> }
  );
  return z.object({ queryStringParams: z.object(shape) });
};
export type QueryStringParams<T extends Record<string, string>> = {
  queryStringParams: T;
};

/** A request schema mixin for routes receiving request bodies. */
export const Body = function <T extends z.ZodRawShape>(bodyShape: T) {
  return z.object({ body: z.object(bodyShape) });
};

export type Body<T> = {
  body: T;
};
