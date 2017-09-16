const urlParser = require("url")

const {
  modelErrorCodes,
} = require('howdju-common')

class UrlValidator {
  validate(url) {
    const errors = UrlValidator.blankErrors()

    // A url can be blank (we will ignore it) but if present, it must be valid
    if (url.url) {
      try {
        urlParser.parse(url.url)
      } catch (e) {
        errors.hasErrors = true
        errors.fieldErrors.url.push(modelErrorCodes.INVALID_URL)
      }
    }

    return errors
  }
}
UrlValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    url: []
  },
})

exports.UrlValidator = UrlValidator
