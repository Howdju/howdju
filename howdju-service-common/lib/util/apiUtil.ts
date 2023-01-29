import set from "lodash/set";
import { z } from "zod";

import {
  BespokeValidationErrors,
  newBespokeValidationErrors,
  logger,
  ModelErrors,
  toJson,
} from "howdju-common";
import {
  EntityConflictError,
  EntityValidationError,
  UserActionsConflictError,
} from "..";

// Several of the errors in serviceErrors have a property `errors` containing errors keyed by the
// field causing the error.
type ErrorsError = Error & {
  errors: z.ZodError<any> | BespokeValidationErrors;
};

function translateErrors(err: ErrorsError, translationKey: string) {
  const errors: BespokeValidationErrors = {
    hasErrors: true,
    modelErrors: [],
    fieldErrors: {},
  };
  if (!translationKey.startsWith("fieldErrors.")) {
    logger.error(
      `translateErrors translationKey does not begin with fieldErrors.: ${translationKey}`
    );
  }
  set(errors, translationKey, err.errors);
  err.errors = errors;
  return err;
}

export const rethrowTranslatedErrors =
  (translationKey: string) => (err: ErrorsError) => {
    throw translateErrors(err, translationKey);
  };

/**
 * Catches errors that wrap entity errors and prefixes the path of the error.
 *
 * This helper allows services to translate an error from another service to the path appropriate
 * for the entity from the client's perspective.
 */
export async function prefixErrorPath<T>(
  thunk: Promise<T>,
  translationKey: string
) {
  try {
    return await thunk;
  } catch (err) {
    if (
      err instanceof EntityValidationError ||
      err instanceof EntityConflictError ||
      err instanceof UserActionsConflictError
    ) {
      if ("_errors" in err.errors) {
        err.errors = set({}, translationKey, err.errors) as ModelErrors<any>;
      } else if ("modelErrors" in err) {
        if (!translationKey.startsWith("fieldErrors.")) {
          logger.error(
            `translateErrors translationKey does not begin with fieldErrors.: ${translationKey}`
          );
        }
        err.errors = set(
          newBespokeValidationErrors(),
          translationKey,
          err.errors
        );
      } else {
        logger.error(
          `withPrependedIssues err.errors does not match either expected type (ModelErrors<any> | BespokeValidationErrors): ${toJson(
            err
          )}`
        );
      }
    }
    throw err;
  }
}
