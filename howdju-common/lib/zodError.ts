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
import { z, ZodFormattedError } from "zod";

import { mapValuesDeep } from "./general";
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
        // TODO: if name is a number, then keep going backwards through path until we get to a
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
export function formatZodError<T>(error: z.ZodError<T>) {
  return removeZodErrorDupes(error.format(zodIssueFormatter));
}

/**
 * Returns error with all duplicate issues remove.
 *
 * Zod can produce duplicate issues. E.g., union fields can produce an identical
 * invalid_type/Required issues for each of the union members. Since duplicate issues are useless to
 * a client (they result in the same error message), we should remove them.
 */
export function removeZodErrorDupes<T, U>(
  error: ZodFormattedError<T, U>
): ZodFormattedError<T, U> {
  return mapValuesDeep(error, (val: any, key: string) => {
    // Perform a deep comparison of errors to remove duplicates.
    if (key === "_errors") {
      console.assert(isArray(val));
      return uniqWith(val, isEqual);
    }
    // Return other vals unchanged.
    return val;
  }) as ZodFormattedError<T, U>;
}

/**
 * An object having the same shape as a model and possibly adding _errors to each field.
 *
 * This type is an alias for a ZodFormattedError having our custom issue format.
 */
export type ModelErrors<T> = z.ZodFormattedError<T, ZodCustomIssueFormat>;
