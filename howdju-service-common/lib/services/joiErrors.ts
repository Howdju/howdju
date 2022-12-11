import { ValidationError } from "joi";
import { z } from "zod";
import { zodIssueFormatter, ZodCustomIssueFormat } from "howdju-common";

/**
 * Converts a Joi error to Zod's error format.
 * @param joiError
 */
export function translateJoiToZodFormattedError<T>(
  joiError: ValidationError
): z.ZodFormattedError<T, ZodCustomIssueFormat> {
  const issues: z.ZodIssue[] = joiError.details.map(({ path, message }) => ({
    code: z.ZodIssueCode.custom,
    path,
    message,
  }));
  return new z.ZodError<T>(issues).format(zodIssueFormatter);
}
