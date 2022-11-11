import { filter, head, isObject } from "lodash"
import { EntityErrorCode, ModelErrorCode } from "./codes"
import { logger } from "./logger"


interface FieldSubErrors {
  // Errors for fields on this field
  fieldErrors: FieldErrors
  // Errors for items in this field (only if this field is an array)
  itemErrors: FieldSubErrors[]
}
type FieldErrorCode = ModelErrorCode | EntityErrorCode
// In a few of our services we perform ad-hoc validation where we include both the code and the
// value
/** @deprecated use ValidationErrors instead. */
export type FieldErrorCodeValue = {
  code: FieldErrorCode
  // The value that resulted in the validation error.
  value: any
}
type FieldErrorValue = FieldErrorCode | FieldErrorCodeValue
interface FieldErrors {
  // TODO(26): FieldSubErrors will probably be overwritten by JSON serialization.
  [key: string]: FieldErrorValue[] & FieldSubErrors
};
export type FieldErrorsValue = FieldErrors[string]
/** @deprecated use ValidationErrors instead. */
export interface BespokeValidationErrors {
  // Whether there are any errors.
  hasErrors: boolean;
  // Errors that apply to the entire model
  modelErrors: ModelErrorCode[];
  // Errors for individual fields on the model.
  fieldErrors: FieldErrors;
};

/**
 * This is the new preferred format for validation errors
 *
 * TODO(26) update validation to use this.
 */
export type ValidationErrors<T> = T extends Array<any> ?
  ArrayValidationErrors<T> :
  ObjectValidationErrors<T>

type ArrayValidationErrors<T extends Array<any>> = {
  errors: {
    [code in FieldErrorCode]: {
      value?: any
    }
  }[]
  items: ValidationErrors<T[number]>[]
}

type ObjectValidationErrors<T> = {
  errors: {
    [field in keyof T]: {
      [code in FieldErrorCode]: {
        value?: any
      }
    }
  }
  fields: {
    [field in keyof T]: ValidationErrors<T[field]>
  }
}


export const EmptyBespokeValidationErrors: Readonly<BespokeValidationErrors>  = {
  hasErrors: false,
  modelErrors: [] as ModelErrorCode[],
  fieldErrors: {},
} as const

/**
 * Return the first field error having code.
 *
 * There should be only one field error for any code; the function will log an error if there are
 * multiple, and return the first.
 */
 export const onlyFieldError = (fieldError: FieldErrorsValue, code: EntityErrorCode): FieldErrorCodeValue | undefined => {
  const errors = filter(fieldError, fe => isObject(fe) && fe.code === code)
  if (errors.length > 1) {
    logger.error(`Multiple field errors have the code ${code}.`)
  }
  // Will always be a FieldErrorCodeValue since we filtered on it being an object above.
  return head(errors) as unknown as FieldErrorCodeValue | undefined
}
