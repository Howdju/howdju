const get = require('lodash/get')

const {
  requireArgs,
  modelErrorCodes,
} = require('howdju-common')

const {PropositionValidator} = require('./PropositionValidator')
const {SourceExcerptValidator} = require('./SourceExcerptValidator')

class SourceExcerptParaphraseValidator {

  constructor(propositionValidator, sourceExcerptValidator) {
    requireArgs({propositionValidator, sourceExcerptValidator})
    this.propositionValidator = propositionValidator
    this.sourceExcerptValidator = sourceExcerptValidator
  }

  validate(sourceExcerptParaphrase) {
    const errors = SourceExcerptParaphraseValidator.blankErrors()

    if (!sourceExcerptParaphrase) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const paraphrasingProposition = get(sourceExcerptParaphrase, 'paraphrasingProposition')
    errors.fieldErrors.paraphrasingProposition = this.propositionValidator.validate(paraphrasingProposition)
    if (errors.fieldErrors.paraphrasingProposition.hasErrors) {
      errors.hasErrors = true
    }

    const sourceExcerpt = get(sourceExcerptParaphrase, 'sourceExcerpt')
    errors.fieldErrors.sourceExcerpt = this.sourceExcerptValidator.validate(sourceExcerpt)
    if (errors.fieldErrors.sourceExcerpt.hasErrors) {
      errors.hasErrors = true
    }

    return errors
  }
}
SourceExcerptParaphraseValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    paraphrasingProposition: PropositionValidator.blankErrors(),
    sourceExcerpt: SourceExcerptValidator.blankErrors(),
  }
})

exports.SourceExcerptParaphraseValidator = SourceExcerptParaphraseValidator
