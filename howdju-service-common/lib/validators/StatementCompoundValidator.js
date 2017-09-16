const map = require('lodash/map')
const some = require('lodash/some')
const get = require('lodash/get')

const {
  modelErrorCodes,
} = require('howdju-common')

class StatementCompoundValidator {
  constructor(statementValidator) {
    this.statementValidator = statementValidator
  }

  validate(statementCompound) {
    const errors = StatementCompoundValidator.blankErrors()

    if (!statementCompound) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const atoms = get(statementCompound, 'atoms')
    if (!atoms) {
      errors.hasErrors = true
      errors.fieldErrors.atoms.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    } else if (atoms.length < 1) {
      errors.hasErrors = true
      errors.fieldErrors.atoms.modelErrors.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else {
      errors.fieldErrors.atoms.itemErrors = map(statementCompound.atoms, atom => ({
        fieldErrors: {
          statement: this.statementValidator.validate(atom.statement)
        }
      }))
      if (some(errors.fieldErrors.atoms.itemErrors, i => i.fieldErrors.statement.hasErrors)) {
        errors.hasErrors = true
      }
    }

    return errors
  }
}
StatementCompoundValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    atoms: {
      modelErrors: [],
      itemErrors: [],
    }
  }
})

exports.StatementCompoundValidator = StatementCompoundValidator
