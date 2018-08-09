const {newProgrammingError} = require('howdju-common')

class Validator {
  constructor(definition, message) {
    this.definition = definition
    this.message = message
  }

  isValid(value) {
    if (this.definition instanceof RegExp) {
      return !!this.definition.exec(value)
    } else {
      throw newProgrammingError(`unsupported validator type`, {
        validator: this,
        validatorDefinitionType: typeof(this.definition)
      })
    }
  }
}

class RouteValidationError extends Error {
  constructor(validationErrors) {
    super()
    this.errors = validationErrors
  }
}

const validateRequest = (appProvider) => ({route, routedRequest}) => {
  const routeValidators = route.validators
  if (routeValidators) {
    const validationErrors = getValidationErrors(routedRequest, routeValidators)
    if (validationErrors) {
      throw new RouteValidationError(validationErrors)
    }
  }

  return {route, routedRequest}
}

const getValidationErrors = (routedRequest, routeValidators) => {

  const validationErrors = []

  const queryStringParametersValidators = routeValidators.queryStringParameters
  if (queryStringParametersValidators) {
    for (const key of Object.getOwnPropertyNames(queryStringParametersValidators)) {
      const validator = queryStringParametersValidators[key]
      const value = routedRequest.queryStringParameters[key]
      if (!validator.isValid(value)) {
        addValidationError(validator, `queryStringParameters[${key}]`, value, validationErrors)
      }
    }
  }

  const pathParametersValidators = routeValidators.pathParameters
  if (pathParametersValidators) {
    for (let i = 0; i < pathParametersValidators.length; i++) {
      const validator = pathParametersValidators[i]
      const value = routedRequest.pathParameters[i]
      if (!validator.isValid(value)) {
        addValidationError(validator, 'pathParameters', value, validationErrors)
      }
    }
  }

  return validationErrors
}

const addValidationError = (validator, location, value, validationErrors) => {
  validationErrors.push({
    message: validator.message,
    invalidValueLocation: location,
    invalidValue: value
  })
}

module.exports = {
  Validator,
  validateRequest,
  getValidationErrors,
}
