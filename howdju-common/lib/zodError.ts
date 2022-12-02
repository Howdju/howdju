import { isNumber } from "lodash";
import { z } from "zod";
import { ModelErrorCode } from "./codes";
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
