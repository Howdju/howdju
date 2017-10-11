const {
  modelErrorCodes,
} = require('howdju-common')

class JustificationVoteValidator {
  validate(vote) {
    const errors = JustificationVoteValidator.blankErrors()

    if (!vote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (!vote.justificationId) {
      errors.hasErrors = true
      errors.fieldErrors.justificationId.push(modelErrorCodes.IS_REQUIRED)
    }

    if (!vote.polarity) {
      errors.hasErrors = true
      errors.fieldErrors.polarity.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
JustificationVoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    justificationId: [],
    polarity: [],
  }
})

exports.JustificationVoteValidator = JustificationVoteValidator
