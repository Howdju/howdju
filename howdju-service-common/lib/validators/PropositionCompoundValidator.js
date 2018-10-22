const map = require('lodash/map')
const some = require('lodash/some')
const get = require('lodash/get')

const {
  modelErrorCodes,
} = require('howdju-common')

class PropositionCompoundValidator {
  constructor(propositionValidator) {
    this.propositionValidator = propositionValidator
  }

  validate(propositionCompound) {
    const errors = PropositionCompoundValidator.blankErrors()

    if (!propositionCompound) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const atoms = get(propositionCompound, 'atoms')
    if (!atoms) {
      errors.hasErrors = true
      errors.fieldErrors.atoms.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    } else if (atoms.length < 1) {
      errors.hasErrors = true
      errors.fieldErrors.atoms.modelErrors.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else {
      errors.fieldErrors.atoms.itemErrors = map(propositionCompound.atoms, atom => ({
        fieldErrors: {
          entity: this.propositionValidator.validate(atom.entity)
        }
      }))
      if (some(errors.fieldErrors.atoms.itemErrors, i => i.fieldErrors.entity.hasErrors)) {
        errors.hasErrors = true
      }
    }

    return errors
  }
}
PropositionCompoundValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    atoms: {
      modelErrors: [],
      itemErrors: [],
    }
  }
})

exports.PropositionCompoundValidator = PropositionCompoundValidator
