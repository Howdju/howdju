import assign from 'lodash/assign'

export const commonErrorTypes = {
  /** Something happened that should have been avoidable (how does this differ from impossible?) */
  PROGRAMMING_ERROR: 'PROGRAMMING_ERROR',

  /** Something happened that should not have been possible. */
  IMPOSSIBLE_ERROR: 'IMPOSSIBLE_ERROR',

  /** We exhausted an enums values, but shouldn't have been able to.  This is a type of programming error. */
  EXHAUSTED_ENUM: 'EXHAUSTED_ENUM',

  /** The required code path is purposefully unimplemented currently. */
  UNIMPLEMENTED_ERROR: 'UNIMPLEMENTED_ERROR',
} as const
export type CommonErrorType = typeof commonErrorTypes[keyof typeof commonErrorTypes]

export interface CustomError extends Error {
  errorType: string
  sourceError: Error
}

/* Identify custom errors with an errorType property.  Subclassing builtins like Error is not widely supported,
 * and the Babel plugin for doing so relies on static detection, which could be flakey
 */
export const newCustomError = (
  errorType: string,
  message: string,
  sourceError?: Error,
  props?: {[key: string]: any}
) => {
  const error = new Error(message) as CustomError
  error.errorType = errorType
  if (sourceError) {
    error.sourceError = sourceError
  }
  assign(error, props)
  return error
}

/**
 * Something has happened which should logically not be possible.
 *
 * This error is useful in basically the same places as newProgrammingError.
 * Looking at current usages, newImpossibleError was used when it was less
 * clear the cause of the mistake, whereas newProgrammingError was used when
 * the cause of the mistake should be fairly obvious, like calling a function
 * with the wrong arguments.
 *
 * I am not sure if the type system will allow me to use this
 * newImpossibleError(never) anywhere useful. If not, just replace one of
 * newProgrammingError and this with the other.
 */
export const newImpossibleError = (value: any) => {
  throw newCustomError(commonErrorTypes.IMPOSSIBLE_ERROR, `Impossible value: ${value}`)
}

/** Something has happened that logically should not. */
export const newProgrammingError = (message: string) =>
  newCustomError(commonErrorTypes.PROGRAMMING_ERROR, message)

export const newExhaustedEnumError = (value: never): never => {
  throw newCustomError(commonErrorTypes.EXHAUSTED_ENUM, `Exhausted enum ${value}`)
}

export const newUnimplementedError = (message: string) =>
  newCustomError(commonErrorTypes.UNIMPLEMENTED_ERROR, message)
