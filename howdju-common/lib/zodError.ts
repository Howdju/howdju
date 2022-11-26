import { get, set } from "lodash";
import { z } from "zod";
import {
  BespokeValidationErrors,
  newBespokeValidationErrors,
} from "./validation";

export function translateZodError<T>(
  error: z.ZodError<T>
): BespokeValidationErrors {
  const allErrors = newBespokeValidationErrors();
  for (const { path, code, message } of error.errors) {
    let errors = get(allErrors, path);
    if (!errors) {
      errors = [];
      set(allErrors, path, errors);
    }
    errors.push({ type: code, message });
  }
  return allErrors;
}
