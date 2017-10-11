const has = require('lodash/has')

const {
  modelErrorCodes,
  StatementTagVotePolarity,
} = require('howdju-common')

const {TagValidator} = require('./TagValidator')


class StatementTagVoteValidator {

  validate(statementTagVote) {
    const errors = StatementTagVoteValidator.blankErrors()

    if (!statementTagVote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IF_PRESENT_MUST_BE_NONEMPTY)
      return errors
    }

    if (has(statementTagVote, 'polarity')) {
      if (!has(StatementTagVotePolarity, statementTagVote.polarity)) {
        errors.hasErrors = true
        errors.fieldErrors.polarity.push(modelErrorCodes.INVALID_VALUE)
      }
    } else {
      errors.hasErrors = true
      errors.fieldErrors.polarity.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
StatementTagVoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    tag: TagValidator.blankErrors(),
    polarity: [],
  },
})

exports.StatementTagVoteValidator = StatementTagVoteValidator
