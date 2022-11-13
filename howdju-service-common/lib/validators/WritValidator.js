const {
  modelErrorCodes,
} = require('howdju-common')

class WritValidator {
  validate(writ) {
    const errors = WritValidator.blankErrors()

    if (!writ) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (writ.title === '') {
      errors.hasErrors = true
      errors.fieldErrors.title.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!writ.title) {
      errors.hasErrors = true
      errors.fieldErrors.title.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
WritValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    title: [],
  },
})

exports.WritValidator = WritValidator
