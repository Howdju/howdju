const has = require('lodash/has')
const includes = require('lodash/includes')

const {
  JustificationBasisType,
  JustificationPolarity,
  JustificationTargetType,
  isTruthy,
  modelErrorCodes,
  newExhaustedEnumError,
} = require('howdju-common')

class JustificationValidator {

  constructor(statementValidator, statementCompoundValidator, writQuoteValidator, justificationBasisCompoundValidator) {
    this.statementValidator = statementValidator
    this.statementCompoundValidator = statementCompoundValidator
    this.writQuoteValidator = writQuoteValidator
    this.justificationBasisCompoundValidator = justificationBasisCompoundValidator
  }

  validate(justification, ignore={}) {
    const errors = JustificationValidator.blankErrors()

    if (!justification) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(justification.id)

    if (!has(justification, 'rootStatement') && !isExtant && !ignore.rootStatement) {
      const canReceiveRootStatementIdFromTarget = justification.target && justification.target.type === JustificationTargetType.STATEMENT
      if (!canReceiveRootStatementIdFromTarget) {
        errors.hasErrors = true
        errors.fieldErrors.rootStatement.push(modelErrorCodes.IS_REQUIRED)
      }
    }

    if (has(justification, 'polarity')) {
      if (!includes(JustificationPolarity, justification.polarity)) {
        errors.hasErrors = true
        errors.fieldErrors.polarity.push(modelErrorCodes.INVALID_VALUE)
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.polarity.push(modelErrorCodes.IS_REQUIRED)
    }

    if (has(justification, 'target')) {
      if (!justification.target) {
        errors.hasErrors = true
        errors.fieldErrors.target.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      } else {
        if (!justification.target.type) {
          errors.hasErrors = true
          errors.fieldErrors.target.fieldErrors.type.push(modelErrorCodes.IS_REQUIRED)
        }
        if (!justification.target.entity) {
          errors.hasErrors = true
          errors.fieldErrors.target.fieldErrors.entity.modelErrors.push(modelErrorCodes.IS_REQUIRED)
        } else {
          if (!justification.target.entity.id) {
            // Must have valid props
            const targetEntityErrors = justification.target.type === JustificationTargetType.JUSTIFICATION ?
              this.validate(justification.target.entity) :
              this.statementValidator.validate(justification.target.entity)
            if (targetEntityErrors.hasErrors) {
              errors.hasErrors = true
              errors.fieldErrors.target.fieldErrors.entity = targetEntityErrors
            }
          }
        }
      }
    } else if (!isExtant && !ignore.target) {
      errors.hasErrors = true
      errors.fieldErrors.target.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    }

    if (has(justification, 'basis')) {
      if (!justification.basis) {
        errors.hasErrors = true
        errors.fieldErrors.basis.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      } else {
        if (!justification.basis.type) {
          errors.hasErrors = true
          errors.fieldErrors.basis.fieldErrors.type.push(modelErrorCodes.IS_REQUIRED)
        }
        if (!justification.basis.entity) {
          errors.hasErrors = true
          errors.fieldErrors.basis.fieldErrors.entity.modelErrors.push(modelErrorCodes.IS_REQUIRED)
        } else {
          if (!justification.basis.entity.id) {
            // Must have valid props
            let basisEntityErrors
            switch (justification.basis.type) {
              case JustificationBasisType.WRIT_QUOTE:
                basisEntityErrors = this.writQuoteValidator.validate(justification.basis.entity)
                break
              case JustificationBasisType.STATEMENT_COMPOUND:
                basisEntityErrors = this.statementCompoundValidator.validate(justification.basis.entity)
                break
              case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
                basisEntityErrors = this.justificationBasisCompoundValidator.validate(justification.basis.entity)
                break
              default:
                throw newExhaustedEnumError('JustificationBasisType', justification.basis.type)
            }

            if (basisEntityErrors.hasErrors) {
              errors.hasErrors = true
              errors.fieldErrors.basis.fieldErrors.entity = basisEntityErrors
            }
          }
        }
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.basis.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
JustificationValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    rootStatement: [],
    polarity: [],
    target: {
      modelErrors: [],
      fieldErrors: {
        type: [],
        entity: {
          modelErrors: [],
          fieldErrors: {},
        },
      },
    },
    basis: {
      modelErrors: [],
      fieldErrors: {
        type: [],
        entity: {
          modelErrors: [],
          fieldErrors: {},
        },
      },
    },
  },
})

exports.JustificationValidator = JustificationValidator