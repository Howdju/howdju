const {
  modelErrorCodes,
} = require('howdju-common')

class UserValidator {
  validate(user) {
    const errors = UserValidator.blankErrors()

    if (!user) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (user.email === '') {
      errors.hasErrors = true
      errors.fieldErrors.email.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!user.email) {
      errors.hasErrors = true
      errors.fieldErrors.email.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
UserValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    email: [],
    password: []
  }
})

exports.UserValidator = UserValidator