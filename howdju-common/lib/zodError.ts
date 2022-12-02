import { isArray, isEqual, isNumber, uniqWith } from "lodash";
import { z, ZodFormattedError } from "zod";

import { ModelErrorCode } from "./codes";
import { mapValuesDeep } from "./general";
import {
  BespokeValidationErrors,
  FieldErrorCode,
  FieldErrorValue,
  FieldSubErrors,
  newBespokeValidationErrors,
} from "./validation";

export function translateZodToModelErrorCode(
  code: z.ZodIssueCode
): ModelErrorCode {
  switch (code) {
    default:
      return "IS_REQUIRED";
  }
}

export function translateZodToFieldErrorCode(
  code: z.ZodIssueCode
): FieldErrorCode {
  switch (code) {
    default:
      return "IS_REQUIRED";
  }
}

export const zodIssueFormatter = (issue: z.ZodIssue) => issue;
export type ZodCustomIssueFormat = ReturnType<typeof zodIssueFormatter>;
export type ErrorFormat = ZodCustomIssueFormat;

/** Formats a Zod error with our custom formatter and removes duplicates. */
export function formatZodError<T>(error: z.ZodError<T>) {
  // Zod can produce duplicate issues. E.g., union fields can produce an identical
  // invalid_type/Required issue for each of the union members. Since duplicate issues are useless
  // to a client, remove them.
  return removeZodErrorDupes(error.format(zodIssueFormatter));
}

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

/** An object having the same shape as a model and possibly adding _errors to each field. */
export type ModelErrors<T> = z.ZodFormattedError<T, ZodCustomIssueFormat>;

/**
 * Translate Zod errors to BespokeValidationErrors.
 *
 * @param error The Zod error
 * @returns BespokeValidationErrors representing the Zod error.
 * @deprecated Just use Zod's error format.
 */
export function translateZodToBespokeErrors<T>(
  error: z.ZodError<T>
): BespokeValidationErrors {
  const allErrors = newBespokeValidationErrors();
  for (const { path, code } of error.errors) {
    if (!path || path.length < 1) {
      allErrors.modelErrors.push(translateZodToModelErrorCode(code));
      continue;
    }
    const [firstPathPart, ...pathParts] = path;
    // BespokeValidationErrors assumes that the first path part must be an object key, whereas
    // ZodError could provide a number. If we validate an array, this assumption will be invalid.
    let currErrors: FieldErrorValue[] & FieldSubErrors =
      allErrors.fieldErrors[firstPathPart];
    if (!currErrors) {
      currErrors = allErrors.fieldErrors[firstPathPart] = [];
    }
    for (const pathPart in pathParts) {
      if (isNumber(pathPart)) {
        if (!currErrors.itemErrors) {
          currErrors.itemErrors = [];
        }
        currErrors = currErrors.itemErrors[pathPart] = [];
      } else {
        if (!currErrors.fieldErrors) {
          currErrors.fieldErrors = {};
        }
        if (!currErrors.fieldErrors[pathPart]) {
          currErrors.fieldErrors[pathPart] = [];
        }
        currErrors = currErrors.fieldErrors[pathPart] = [];
      }
    }
    currErrors.push({ code: translateZodToFieldErrorCode(code) });
  }
  return allErrors;
}
