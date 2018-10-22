const get = require('lodash/get')

const {
  requireArgs,
  modelErrorCodes,
  JustificationBasisCompoundAtomType,
} = require('howdju-common')

class JustificationBasisCompoundAtomValidator {

  constructor(propositionValidator, sourceExcerptParaphraseValidator) {
    requireArgs({propositionValidator, sourceExcerptParaphraseValidator})
    this.propositionValidator = propositionValidator
    this.sourceExcerptParaphraseValidator = sourceExcerptParaphraseValidator
  }

  validate(atom) {
    const errors = JustificationBasisCompoundAtomValidator.blankErrors()

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
        case JustificationBasisCompoundAtomType.PROPOSITION: {
          errors.fieldErrors.entity = this.propositionValidator.validate(atom.entity)
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
