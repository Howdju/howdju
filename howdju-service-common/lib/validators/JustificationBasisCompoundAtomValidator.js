const get = require('lodash/get')

const {
  requireArgs,
  modelErrorCodes,
  JustificationBasisCompoundAtomType,
} = require('howdju-common')

const {
  JustificationBasisCompoundValidator
} = require('./validators')

class JustificationBasisCompoundAtomValidator {

  constructor(statementValidator, sourceExcerptParaphraseValidator) {
    requireArgs({statementValidator, sourceExcerptParaphraseValidator})
    this.statementValidator = statementValidator
    this.sourceExcerptParaphraseValidator = sourceExcerptParaphraseValidator
  }

  validate(atom) {
    const errors = JustificationBasisCompoundValidator.blankErrors()

    if (!atom) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const type = get(atom, 'type')
    if (!type) {
      errors.hasErrors = true
      errors.fieldErrors.type.push(modelErrorCodes.IS_REQUIRED)
    } else {
      switch (type) {
        case JustificationBasisCompoundAtomType.STATEMENT: {
          errors.fieldErrors.entity = this.statementValidator.validate(atom.entity)
          if (errors.fieldErrors.entity.hasErrors) {
            errors.hasErrors = true
          }
          break
        }
        case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
          errors.fieldErrors.entity = this.sourceExcerptParaphraseValidator.validate(atom.entity)
          if (errors.fieldErrors.entity.hasErrors) {
            errors.hasErrors = true
          }
          break
        default:
          errors.fieldErrors.type.push(modelErrorCodes.INVALID_VALUE)
          break
      }
    }

    return errors
  }
}
JustificationBasisCompoundAtomValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    type: [],
    entity: {
      modelErrors: [],
      fieldErrors: {},
    }
  }
})

exports.JustificationBasisCompoundAtomValidator = JustificationBasisCompoundAtomValidator
