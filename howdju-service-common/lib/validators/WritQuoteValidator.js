const isArray = require('lodash/isArray')
const map = require('lodash/map')
const some = require('lodash/some')
const has = require('lodash/has')

const {
  isTruthy,
  modelErrorCodes,
} = require('howdju-common')

const {
  WritValidator
} = require('./validators')

class WritQuoteValidator {
  constructor(writValidator, urlValidator) {
    this.writValidator = writValidator
    this.urlValidator = urlValidator
  }

  validate(writQuote) {
    const errors = WritQuoteValidator.blankErrors()

    if (!writQuote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(writQuote.id)

    if (has(writQuote, 'writ')) {
      errors.fieldErrors.writ = this.writValidator.validate(writQuote.writ)
      if (errors.fieldErrors.writ.hasErrors) {
        errors.hasErrors = true
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.source.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    }

    if (has(writQuote, 'urls')) {
      if (!isArray(writQuote.urls)) {
        errors.hasErrors = true
        errors.fieldErrors.urls.modelErrors.push(modelErrorCodes.IF_PRESENT_MUST_BE_ARRAY)
      } else {
        errors.fieldErrors.urls.itemErrors = map(writQuote.urls, this.urlValidator.validate)
        if (some(errors.fieldErrors.urls.itemErrors, i => i.hasErrors)) {
          errors.hasErrors = true
        }
      }
    }

    return errors
  }
}
WritQuoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    quoteText: [],
    source: WritValidator.blankErrors(),
    urls: {
      modelErrors: [],
      itemErrors: [],
    }
  },
})

exports.WritQuoteValidator = WritQuoteValidator