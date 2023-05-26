import { cloneDeep, filter, head, isObject } from "lodash";
import { Writable } from "type-fest";
import { EntityConflictCode, EntityErrorCode, ModelErrorCode } from "./codes";
import { logger } from "./logger";

export interface FieldSubErrors {
  // Errors for fields on this field
  fieldErrors?: FieldErrors;
  // Errors for items in this field (only if this field is an array)
  itemErrors?: (FieldErrorValue[] & FieldSubErrors)[];
}
export type FieldErrorCode = ModelErrorCode | EntityErrorCode;
// In a few of our services we perform ad-hoc validation where we include both the code and the
// value
/** @deprecated use ModelErrors instead. */
export type FieldErrorCodeValue = {
  code: FieldErrorCode;
  // The value that resulted in the validation error, if applicable.
  value?: any;
};
export type FieldErrorValue = FieldErrorCode | FieldErrorCodeValue;
interface FieldErrors {
  // TODO(26): FieldSubErrors will probably be ignored by JSON serialization.
  [key: string]: FieldErrorValue[] & FieldSubErrors;
}
/** @deprecated use ModelErrors instead. */
export interface BespokeValidationErrors {
  // Whether there are any errors.
  hasErrors: boolean;
  // Errors that apply to the entire model
  modelErrors: (ModelErrorCode | EntityConflictCode)[];
  // Errors for individual fields on the model.
  fieldErrors?: FieldErrors;
}

export const EmptyBespokeValidationErrors: Readonly<BespokeValidationErrors> = {
  hasErrors: false,
  modelErrors: [] as ModelErrorCode[],
  fieldErrors: {},
} as const;

export function newBespokeValidationErrors() {
  return cloneDeep(
    EmptyBespokeValidationErrors
  ) as Writable<BespokeValidationErrors>;
}

export type FieldErrorsValue = FieldErrors[string];

/**
 * Return the first field error having code.
 *
 * There should be only one field error for any code; the function will log an error if there are
 * multiple, and return the first.
 */
export const onlyFieldError = (
  fieldError?: FieldErrorsValue,
  code?: EntityErrorCode
): FieldErrorCodeValue | undefined => {
  const errors = filter(fieldError, (fe) => isObject(fe) && fe.code === code);
  if (errors.length > 1) {
    logger.error(`Multiple field errors have the code ${code}.`);
  }
  // Will always be a FieldErrorCodeValue since we filtered on it being an object above.
  return head(errors) as unknown as FieldErrorCodeValue | undefined;
};
