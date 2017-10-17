const has = require('lodash/has')
const map = require('lodash/map')
const some = require('lodash/some')

const {
  isTruthy,
  modelErrorCodes,
  requireArgs,
} = require('howdju-common')


class StatementValidator {

  constructor (tagValidator) {
    requireArgs({
      tagValidator,
    })

    this.tagValidator = tagValidator
  }

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

    if (has(statement, 'tags')) {
      errors.fieldErrors.tags.itemErrors  = map(statement.tags, tag => {
        const tagErrors = this.tagValidator.validate(tag)
        return tagErrors
      })
      if (some(errors.fieldErrors.tags.itemErrors, itemError => itemError.hasErrors)) {
        errors.hasErrors = true
      }
    }

    return errors
  }
}
StatementValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    text: [],
    tags: {
      modelErrors: [],
      itemErrors: [],
    },

  },
})

exports.StatementValidator = StatementValidator
