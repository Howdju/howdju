const get = require('lodash/get')

const {
  requireArgs,
  modelErrorCodes,
  SourceExcerptType,
  newUnimplementedError,
} = require('howdju-common')

const {
  WritQuoteValidator,
  PicRegionValidator,
  VidSegmentValidator,
  genericModelBlankErrors,
} = require('./validators')

class SourceExcerptValidator {

  constructor(writQuoteValidator) {
    requireArgs({writQuoteValidator})
    this.writQuoteValidator = writQuoteValidator
  }

  validate(sourceExcerpt) {
    const type = get(sourceExcerpt, 'type')
    const errors = SourceExcerptValidator.blankErrors(type)

    if (!sourceExcerpt) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (!type) {
      errors.hasErrors = true
      errors.fieldErrors.type.push(modelErrorCodes.IS_REQUIRED)
    } else {
      switch (type) {
        case SourceExcerptType.WRIT_QUOTE: {
          errors.fieldErrors.entity = this.writQuoteValidator.validate(sourceExcerpt.entity)
          if (errors.fieldErrors.entity.hasErrors) {
            errors.hasErrors = true
          }
          break
        }
        case SourceExcerptType.PIC_REGION:
        case SourceExcerptType.VID_SEGMENT:
          throw newUnimplementedError(`Validation is unimplemented for source excerpt type: ${type}`)
        default:
          errors.fieldErrors.type.push(modelErrorCodes.INVALID_VALUE)
          break
      }
    }

    return errors
  }
}
SourceExcerptValidator.blankErrors = (type) => {
  let blankEntityErrors
  switch (type) {
    case SourceExcerptType.WRIT_QUOTE:
      blankEntityErrors = WritQuoteValidator.blankErrors()
      break
    case SourceExcerptType.PIC_REGION:
      blankEntityErrors = PicRegionValidator.blankErrors()
      break
    case SourceExcerptType.VID_SEGMENT:
      blankEntityErrors = VidSegmentValidator.blankErrors()
      break
    default:
      blankEntityErrors = genericModelBlankErrors()
      break
  }
  return {
    hasErrors: false,
    modelErrors: [],
    fieldErrors: {
      type: [],
      entity: blankEntityErrors,
    }
  }
}

exports.SourceExcerptValidator = SourceExcerptValidator
