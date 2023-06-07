import { ValidationError } from "joi";
import { z } from "zod";
import {
  ZodFormattedError,
  ModelErrors,
  zodIssueFormatter,
} from "howdju-common";

/**
 * Converts a Joi error to Zod's error format.
 * @param joiError
 */
export function translateJoiToZodFormattedError<T>(
  joiError: ValidationError
): ModelErrors<T> {
  const issues: z.ZodIssue[] = joiError.details.map(({ path, message }) => ({
    code: z.ZodIssueCode.custom,
    path,
    message,
  }));
  return new z.ZodError<T>(issues).format(
    zodIssueFormatter
  ) as ZodFormattedError<T, z.ZodIssue>;
}
