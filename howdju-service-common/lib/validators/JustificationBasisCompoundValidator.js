const get = require('lodash/get')
const map = require('lodash/map')
const some = require('lodash/some')

const {
  modelErrorCodes,
  requireArgs,
} = require('howdju-common')

class JustificationBasisCompoundValidator {
  constructor(justificationBasisCompoundAtomValidator) {
    requireArgs({justificationBasisCompoundAtomValidator})
    this.justificationBasisCompoundAtomValidator = justificationBasisCompoundAtomValidator
  }

  validate(justificationBasisCompound) {
    const errors = JustificationBasisCompoundValidator.blankErrors()

    if (!justificationBasisCompound) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const atoms = get(justificationBasisCompound, 'atoms')
    if (!atoms) {
      errors.hasErrors = true
      errors.fieldErrors.atoms.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    } else if (atoms.length < 1) {
      errors.hasErrors = true
      errors.fieldErrors.atoms.modelErrors.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else {
      errors.fieldErrors.atoms.itemErrors = map(justificationBasisCompound.atoms, atom =>
        this.justificationBasisCompoundAtomValidator.validate(atom))
      if (some(errors.fieldErrors.atoms.itemErrors, i => i.fieldErrors.entity.hasErrors)) {
        errors.hasErrors = true
      }
    }

    return errors
  }
}
JustificationBasisCompoundValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    atoms: {
      modelErrors: [],
      itemErrors: [],
    }
  }
})

exports.JustificationBasisCompoundValidator = JustificationBasisCompoundValidator
