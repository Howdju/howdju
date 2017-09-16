const has = require('lodash/has')

const {
  isTruthy,
  modelErrorCodes,
} = require('howdju-common')

class StatementValidator {
  validate(statement) {
    const errors = StatementValidator.blankErrors()

    if (!statement) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(statement.id)

    if (has(statement, 'text')) {
      if (!statement.text) {
        errors.hasErrors = true
        errors.fieldErrors.text.push(modelErrorCodes.MUST_BE_NONEMPTY)
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.text.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
StatementValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    text: []
  },
})

exports.StatementValidator = StatementValidator
