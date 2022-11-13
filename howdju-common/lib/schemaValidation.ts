// Quick-start: https://json-schema.org/understanding-json-schema/index.html
// Look here for some custom keywords: https://github.com/epoberezkin/ajv-keywords

import { default as Ajv, Options } from 'ajv'
import { ErrorObject, JTDDataType, ValidateFunction } from 'ajv/dist/core'
import addFormats from 'ajv-formats'
import { default as standaloneCode } from "ajv/dist/standalone"
import mapValues from 'lodash/mapValues'
import assign from 'lodash/assign'
import pick from 'lodash/pick'
import set from 'lodash/set'
import reduce from 'lodash/reduce'
import values from 'lodash/values'

import { fromJson, toJson } from './general'
import { schemas, definitionsSchema, SchemaId, Schema, schemasById } from './schemas'

export function makeStandaloneCode() {
  const ajv = makeAjv({code: {source: true}})
  return standaloneCode(ajv)
}

export const schemaIds = mapValues(schemas, schema => schema['$id'])

export function makeAjv(extraOpts?: Options) {
  const opts = assign(
    {},
    {
      // https://github.com/epoberezkin/ajv#options
      // allow $data references
      $data: true,
      // report all errors with data, not just the first error
      allErrors: true,
      verbose: true,
    },
    extraOpts,
  )
  const ajv = new Ajv(opts)
    .addSchema(values(schemas))
    .addSchema(definitionsSchema)
  addFormats(ajv)
  return ajv
}

export function makeStandaloneValidate(validateFunctions: {[key in SchemaId]: ValidateFunction<JTDDataType<typeof schemasById[key]>>}) {
  return function validate(schemaOrRef: SchemaId, data: any) {
    const validationFunction = validateFunctions[schemaOrRef]
    const jsonVal = toJsonVal(data)
    const isValid = validationFunction(jsonVal)
    const errors = isValid ?
      {} :
      transformErrors(validationFunction.errors)
    return {isValid, errors}
  }
}

type ToSchema<T extends SchemaId | Schema> =
  T extends Schema ? T : T extends SchemaId ? typeof schemasById[T] : never
interface ValidationResult<S extends Schema> {
  isValid: boolean
  errors: ValidationErrors<S>
}
type ValidationErrors<S extends Schema> = ToValidationError<S>
type ToValidationError<S extends Schema> =
  {
    // For every property in the schema
    [prop in keyof S["properties"]]+?:
      // if the property is a reference to another schema
      S["properties"][prop] extends {"$ref": keyof typeof schemasById} ?
        // then recurse on that schema
        ToValidationError<typeof schemasById[S["properties"][prop]["$ref"]]> :
        // otherwise it's a possible ValidationError (possible because of `+?` above.)
        ValidationError
}
interface ValidationError {
  keyword: string
  message: string
  params: Record<string, any>
}

export function makeValidate(ajv: Ajv) {
  return function validate<T extends SchemaId | Schema>(schemaOrRef: T, data: any): ValidationResult<ToSchema<T>> {
    if (!data) {
      return emptyValidationResult()
    }
    const jsonVal = toJsonVal(data)
    const isValid = ajv.validate(schemaOrRef, jsonVal)
    const errors = isValid ?
      {} :
      // @ts-ignore: avoid `Type instantiation is excessively deep and possibly infinite.`
      transformErrors<ToSchema<T>>(ajv.errors)
    return {isValid, errors}
  }
}

/** Transform the array of errors into an object keyed by the invalid data's path. */
function transformErrors<S extends Schema>(errors: ErrorObject[] | null | undefined): ValidationErrors<S> {
  // Internationalize error messages: https://github.com/epoberezkin/ajv-i18n
  return reduce(errors, (transformed, error) => {
    let name
    if (error.instancePath === '') {
      // When a required property is missing, the instancePath is the empty string
      if (error.keyword === 'required') {
        name = error.params.missingProperty
      } else {
        throw new Error(`unsupported Ajv error ${JSON.stringify(error)}`)
      }
    } else {
      // Ajv instancePaths start with a root slash
      name = error.instancePath.substr(1)
    }
    // TODO doesn't this overwrite multiple errors with the same field?
    // TODO setting these fields directly at `name` means that we might overwrite them with a field
    // having the same name.
    set(transformed, name, pick(error, [
      "keyword",
      "message",
      "params",
    ]))
    return transformed
  }, {}) as ValidationErrors<S>
}

/** Convert val to a JSON compatible object. Useful for ensuring moments are converted to strings. */
function toJsonVal(val: any) {
  return fromJson(toJson(val))
}

/** Helper to create an empty validation result.
 *
 * Use like:
 *
 * ```
 * const {errors: validationErrors, isValid} = registration ?
 *   validate(schemas.registrationRequest, registration) :
 *   emptyValidationResult(schemas.registrationRequest)
 * ```
 *
 * The schema argument is only for type inference of the returned value. Alternatively one can do:
 * `emptyValidationResult<typeof schemas.registrationRequest>()`.
 */
export function emptyValidationResult<T extends SchemaId | Schema>(_schemaOrRef?: T): ValidationResult<ToSchema<T>> {
  return {isValid: true, errors: {}}
}
