const has = require('lodash/has')

const {
  modelErrorCodes,
  PropositionTagVotePolarity,
} = require('howdju-common')

const {TagValidator} = require('./TagValidator')


class PropositionTagVoteValidator {

  validate(propositionTagVote) {
    const errors = PropositionTagVoteValidator.blankErrors()

    if (!propositionTagVote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IF_PRESENT_MUST_BE_NONEMPTY)
      return errors
    }

    if (has(propositionTagVote, 'polarity')) {
      if (!has(PropositionTagVotePolarity, propositionTagVote.polarity)) {
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
PropositionTagVoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    tag: TagValidator.blankErrors(),
    polarity: [],
  },
})

exports.PropositionTagVoteValidator = PropositionTagVoteValidator
