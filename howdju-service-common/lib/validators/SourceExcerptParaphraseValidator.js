const get = require('lodash/get')

const {
  requireArgs,
  modelErrorCodes,
} = require('howdju-common')

const {StatementValidator} = require('./StatementValidator')
const {SourceExcerptValidator} = require('./SourceExcerptValidator')

class SourceExcerptParaphraseValidator {

  constructor(statementValidator, sourceExcerptValidator) {
    requireArgs({statementValidator, sourceExcerptValidator})
    this.statementValidator = statementValidator
    this.sourceExcerptValidator = sourceExcerptValidator
  }

  validate(sourceExcerptParaphrase) {
    const errors = SourceExcerptParaphraseValidator.blankErrors()

    if (!sourceExcerptParaphrase) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const paraphrasingStatement = get(sourceExcerptParaphrase, 'paraphrasingStatement')
    errors.fieldErrors.paraphrasingStatement = this.statementValidator.validate(paraphrasingStatement)
    if (errors.fieldErrors.paraphrasingStatement.hasErrors) {
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
    paraphrasingStatement: StatementValidator.blankErrors(),
    sourceExcerpt: SourceExcerptValidator.blankErrors(),
  }
})

exports.SourceExcerptParaphraseValidator = SourceExcerptParaphraseValidator
