import { reduce } from "lodash";
import { z } from "zod";

/** A request schema mixin for routes receiving an auth token. */
export const Authed = z.object({
  authToken: z.string(),
});
type Authed = z.infer<typeof Authed>;

/** A request schema mixin for routes receiving path parameters. */
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
