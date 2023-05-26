import {
  isArray,
  isEqual,
  isString,
  join,
  map,
  startCase,
  toString,
  uniqWith,
} from "lodash";
import { z } from "zod";

import { assert, mapValuesDeep } from "./general";
import { logger } from "./logger";

export const zodIssueFormatter = (issue: z.ZodIssue) => issue;
export type ZodCustomIssueFormat = ReturnType<typeof zodIssueFormatter>;
export type IssueFormat = ZodCustomIssueFormat;

/** Returns a user-readable string representing errorFormat. */
export function errorFormatToString(errorFormat: IssueFormat): string {
  switch (errorFormat.code) {
    case "invalid_type": {
      const { received, message } = errorFormat;
      if (received === "undefined" && message === "Required") {
        // TODO(360) if name is a number, then keep going backwards through path until we get to a
        // string. Keep track of the numbers, and then add them after the string. So `["prop", 1, 2]`
        // would become `prop[1][2]`.
        const rawName = errorFormat.path[errorFormat.path.length - 1];
        if (!isString(rawName)) {
          logger.warn(
            `errorFormatToString got a type that doesn't format nicely (${rawName}: ${typeof rawName})`
          );
        }
        const name = toString(rawName);
        const casedName = startCase(name);
        return `${casedName} is required`;
      }
      return errorFormat.message;
    }
    case "invalid_union_discriminator": {
      const { options } = errorFormat;
      const joinedOptions = join(map(options, startCase), ", ");
      return `Invalid option. Must be one of: ${joinedOptions}`;
    }

    default:
      return errorFormat.message;
  }
}

/** Formats a Zod error with our custom formatter and removes duplicates. */
export function formatZodError<T>(error: z.ZodError<T>): ModelErrors<T> {
  return removeZodErrorDupes(error.format(zodIssueFormatter));
}

/**
 * Helper for constructing a Zod error based upon the fields of a type.
 *
 * ```
 * const error = newValidationError<User>([
 *   (r) => r.user.name("Email is already in use."),
 * ]);
 * ```
 *
 * See tests for expanded usage.
 *
 * @param issueDescriptors Lambdas describing the issues. If the arg is a string, it will become the
 *   message. Otherwise the arg must be the props of a Zod custom issue (minus the code.).
 * @returns the Zod error.
 */
export function makeZodCustomIssuesError<T extends object>(
  issueDescriptors: IssueDescriptor<T>[]
): z.ZodError<T> {
  const proxy = makeCallableProxy<T>();
  const issues = issueDescriptors.map((d) => d(proxy)) as z.ZodIssue[];
  return new z.ZodError<T>(issues);
}

/** Helper that formats the result of calling zodCustomIssuesError. */
export function makeModelErrors<T extends object>(
  ...issueDescriptors: IssueDescriptor<T>[]
): ModelErrors<T> {
  return formatZodError(makeZodCustomIssuesError(issueDescriptors));
}

/**
 * A method that describes an issue at a path.
 */
type IssueDescriptor<T> = (t: Callable<T, IssueDescriptorArg>) => any;

/**
 * A type helper that converts a type T into another type that has all callable fields.
 *
 * @typeparam T the shape of the object
 * @typeparam A the type of the arg of the methods.
 */
export type Callable<T, A> = {
  (a: A): any;
} & (NonNullable<T> extends [any, ...any[]]
  ? { [K in keyof NonNullable<T>]: Callable<NonNullable<T>[K], A> }
  : NonNullable<T> extends any[]
  ? { [k: number]: Callable<NonNullable<T>[number], A> }
  : NonNullable<T> extends object
  ? { [K in keyof NonNullable<T>]: Callable<NonNullable<T>[K], A> }
  : unknown);

/** The acceptable arg to an issue descriptor. */
type IssueDescriptorArg = string | Omit<z.ZodCustomIssue, "code" | "path">;

// A singleton function to pass to the proxy so that the proxy supports the `apply` trap.
// Other than the fact that it is a function, it's value has no effect on the behavior of makeCallableProxy.
const callableProxyTarget = function () {};

/**
 * Returns a Proxy for which every field is callable with issue format information.
 *
 * If called with a string, it becomes the message. If called with an object, it must contain a
 * message field and can contain any other fields.
 */
function makeCallableProxy<T>(): Callable<T, IssueDescriptorArg> {
  const names: (string | number | symbol)[] = [];
  return new Proxy(callableProxyTarget as Callable<T, IssueDescriptorArg>, {
    get(_target, name, receiver) {
      names.push(name);
      return receiver;
    },
    apply(_target, _thisArg, argumentsList): z.ZodCustomIssue {
      if (argumentsList.length !== 1) {
        throw new Error("Must be a single argument.");
      }
      let props;
      const arg = argumentsList[0];
      if (isString(arg)) {
        props = { message: arg };
      } else if ("message" in arg) {
        props = arg;
      } else {
        throw new Error(
          "Argument must be a string or an object with at least a .message property."
        );
      }
      return {
        code: z.ZodIssueCode.custom,
        path: names,
        ...props,
      };
    },
  });
}

/**
 * Returns error with all duplicate issues remove.
 *
 * Zod can produce duplicate issues. E.g., union fields can produce an identical
 * invalid_type/Required issues for each of the union members. Since duplicate issues are useless to
 * a client (they result in the same error message), we should remove them.
 */
export function removeZodErrorDupes<T, U>(
  error: z.ZodFormattedError<T, U>
): ZodFormattedError<T, U> {
  return mapValuesDeep(
    error,
    (val: any, key: string) => {
      // Perform a deep comparison of errors to remove duplicates.
      if (key === "_errors") {
        assert(isArray(val));
        return uniqWith(val, isEqual);
      }
      // Return other vals unchanged.
      return val;
    },
    { mapArrays: false }
  ) as ZodFormattedError<T, U>;
}

/**
 * An object having the same shape as a model and possibly adding _errors to each field.
 *
 * This type is an alias for a ZodFormattedError having our custom issue format.
 */
export type ModelErrors<T> = ZodFormattedError<T, ZodCustomIssueFormat>;

/**
 * A ZodFormattedError that supports optional arrays
 *
 * TODO(349) try to contribut this to zod
 */
export type ZodFormattedError<T, U = string> = {
  _errors: U[];
} & (T extends [any, ...any[]]
  ? {
      [K in keyof T]?: ZodFormattedError<T[K], U>;
    }
  : T extends any[]
  ? {
      [k: number]: ZodFormattedError<T[number], U>;
    }
  : T extends (infer V)[] | undefined
  ?
      | {
          [k: number]: ZodFormattedError<V, U>;
        }
      | undefined
  : T extends object
  ? {
      [K in keyof T]?: ZodFormattedError<T[K], U>;
    }
  : unknown);
