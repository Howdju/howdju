import set from "lodash/set";

import {
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

/**
 * Catches errors that contain entity field paths and prefixes the paths with some parent path.
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
