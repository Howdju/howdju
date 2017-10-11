const has = require('lodash/has')

const {
  modelErrorCodes,
} = require('howdju-common')

exports.TagValidator = class TagValidator {
  validate(tag) {
    const errors = TagValidator.blankErrors()

    if (!tag) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IF_PRESENT_MUST_BE_NONEMPTY)
      return errors
    }

    if (has(tag, 'name')) {
      if (!tag.name) {
        errors.hasErrors = true
        errors.fieldErrors.name.push(modelErrorCodes.MUST_BE_NONEMPTY)
      }
    } else {
      errors.hasErrors = true
      errors.fieldErrors.name.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
exports.TagValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    name: [],
  },
})