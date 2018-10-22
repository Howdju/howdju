const get = require('lodash/get')
const has = require('lodash/has')
const includes = require('lodash/includes')

const {
  JustificationBasisType,
  JustificationPolarity,
  JustificationTargetType,
  isTruthy,
  modelErrorCodes,
  newExhaustedEnumError,
  idEqual,
} = require('howdju-common')

class JustificationValidator {

  constructor(propositionValidator, propositionCompoundValidator, writQuoteValidator, justificationBasisCompoundValidator) {
    this.propositionValidator = propositionValidator
    this.propositionCompoundValidator = propositionCompoundValidator
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

    if (has(justification, 'rootProposition')) {
      if (justification.rootProposition.id) {
        const justificationTargetType = get(justification, 'target.type')
        if (
          justificationTargetType === JustificationTargetType.PROPOSITION &&
          justification.target.entity.id
        ) {
          if (!idEqual(justification.rootProposition.id, justification.target.entity.id)) {
            errors.fieldErrors.rootProposition.push(modelErrorCodes.JUSTIFICATION_ROOT_PROPOSITION_ID_AND_TARGET_PROPOSITION_ID_MUST_BE_EQUAL)
          }
        }
      } else {
        const rootPropositionErrors = this.propositionValidator.validate(justification.target.entity)
        if (rootPropositionErrors.hasErrors) {
          errors.hasErrors = true
          errors.fieldErrors.rootProposition = rootPropositionErrors
        }
      }
    } else if (!isExtant && !ignore.rootProposition) {
      const justificationTargetType = get(justification, 'target.type')
      const canReceiveRootPropositionIdFromTarget = justificationTargetType === JustificationTargetType.PROPOSITION
      if (!canReceiveRootPropositionIdFromTarget) {
        errors.hasErrors = true
        errors.fieldErrors.rootProposition.push(modelErrorCodes.IS_REQUIRED)
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

            let targetEntityErrors
            switch (justification.target.type) {
              case JustificationTargetType.JUSTIFICATION:
                targetEntityErrors = this.validate(justification.target.entity)
                break
              case JustificationTargetType.PROPOSITION:
                targetEntityErrors = this.propositionValidator.validate(justification.target.entity)
                break
              default:
                throw newExhaustedEnumError('JustificationTargetType', justification.target.type)
            }

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
              case JustificationBasisType.PROPOSITION_COMPOUND:
                basisEntityErrors = this.propositionCompoundValidator.validate(justification.basis.entity)
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
    rootProposition: [],
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