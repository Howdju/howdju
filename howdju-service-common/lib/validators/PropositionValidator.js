const has = require('lodash/has')
const map = require('lodash/map')
const some = require('lodash/some')

const {
  isTruthy,
  modelErrorCodes,
  requireArgs,
} = require('howdju-common')


class PropositionValidator {

  constructor (tagValidator) {
    requireArgs({
      tagValidator,
    })

    this.tagValidator = tagValidator
  }

  validate(proposition) {
    const errors = PropositionValidator.blankErrors()

    if (!proposition) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(proposition.id)

    if (has(proposition, 'text')) {
      if (!proposition.text) {
        errors.hasErrors = true
        errors.fieldErrors.text.push(modelErrorCodes.MUST_BE_NONEMPTY)
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.text.push(modelErrorCodes.IS_REQUIRED)
    }

    if (has(proposition, 'tags')) {
      errors.fieldErrors.tags.itemErrors  = map(proposition.tags, tag => {
        const tagErrors = this.tagValidator.validate(tag)
        return tagErrors
      })
      if (some(errors.fieldErrors.tags.itemErrors, itemError => itemError.hasErrors)) {
        errors.hasErrors = true
      }
    }

    return errors
  }
}
PropositionValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    text: [],
    tags: {
      modelErrors: [],
      itemErrors: [],
    },
  },
})

exports.PropositionValidator = PropositionValidator
