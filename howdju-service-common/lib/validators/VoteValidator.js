const {
  modelErrorCodes,
} = require('howdju-common')

class VoteValidator {
  validate(vote) {
    const errors = VoteValidator.blankErrors()

    if (!vote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (!vote.targetType) {
      errors.hasErrors = true
      errors.fieldErrors.targetType.push(modelErrorCodes.IS_REQUIRED)
    }

    if (!vote.targetId) {
      errors.hasErrors = true
      errors.fieldErrors.targetId.push(modelErrorCodes.IS_REQUIRED)
    }

    if (!vote.polarity) {
      errors.hasErrors = true
      errors.fieldErrors.polarity.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
VoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    targetType: [],
    targetId: [],
    polarity: [],
  }
})

exports.VoteValidator = VoteValidator
