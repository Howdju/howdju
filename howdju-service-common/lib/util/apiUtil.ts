import set from "lodash/set";
import { z } from "zod";

// Several of the errors in serviceErrors have a property `errors` containing errors keyed by the
// field causing the error.
type ErrorsError = typeof Error & {
  errors: {
    [k: string]: Error;
  };
};

export const rethrowTranslatedErrors =
  (translationKey: string) => (err: ErrorsError) => {
    const errors = {};
    set(errors, translationKey, err.errors);
    err.errors = errors;
    throw err;
  };

/** Returns thunk's result, prepending translationKey to a thrown Zod error's issue paths. */
export async function withPrependedIssues<T>(
  thunk: Promise<T>,
  translationKey: string
) {
  try {
    return await thunk;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw prependIssuePaths(err, translationKey);
    }
    throw err;
  }
}

function prependIssuePaths(err: z.ZodError, translationKey: string) {
  return new z.ZodError(
    err.issues.map((i) => prependIssuePath(i, translationKey))
  );
}

function prependIssuePath(issue: z.ZodIssue, translationKey: string) {
  const path = [translationKey, ...issue.path];
  return { ...issue, path };
}
