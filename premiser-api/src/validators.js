const isArray = require('lodash/isArray')
const map = require('lodash/map')
const some = require('lodash/some')
const has = require('lodash/has')
const includes = require('lodash/includes')
const urlParser = require("url");

const {
  JustificationTargetType,
  JustificationBasisType,
  JustificationPolarity,
} = require("./models")
const {
  isTruthy
} = require('./util')
const modelErrorCodes = require('./codes/modelErrorCodes')

class CredentialValidator {
  validate(credentials) {
    const errors = CredentialValidator.blankErrors()

    if (!credentials) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (credentials.email === '') {
      errors.hasErrors = true
      errors.fieldErrors.email.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!credentials.email) {
      errors.hasErrors = true
      errors.fieldErrors.email.push(modelErrorCodes.IS_REQUIRED)
    }

    if (credentials.password === '') {
      errors.hasErrors = true
      errors.fieldErrors.password.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!credentials.password) {
      errors.hasErrors = true
      errors.fieldErrors.password.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
CredentialValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    email: [],
    password: [],
  },
})

class JustificationValidator {
  constructor(statementValidator, citationReferenceValidator) {
    this.statementValidator = statementValidator
    this.citationReferenceValidator = citationReferenceValidator
  }
  validate(justification, ignore={}) {
    const errors = JustificationValidator.blankErrors()

    if (!justification) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(justification.id)

    if (has(justification, 'rootStatementId') || !isExtant && !ignore.rootStatementId) {
      const canReceiveRootStatementIdFromTarget = justification.target && justification.target.type === JustificationTargetType.STATEMENT
      if (!canReceiveRootStatementIdFromTarget) {
        errors.hasErrors = true
        errors.fieldErrors.rootStatementId.push(modelErrorCodes.IS_REQUIRED)
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
            const basisEntityErrors = justification.basis.type === JustificationBasisType.CITATION_REFERENCE ?
                this.citationReferenceValidator.validate(justification.basis.entity) :
                this.statementValidator.validate(justification.basis.entity)
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
    rootStatementId: [],
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

class StatementValidator {
  validate(statement) {
    const errors = StatementValidator.blankErrors()

    if (!statement) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(statement.id)

    if (has(statement, 'text')) {
      if (!statement.text) {
        errors.hasErrors = true
        errors.fieldErrors.text.push(modelErrorCodes.MUST_BE_NONEMPTY)
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.text.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
StatementValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    text: []
  },
})

class CitationReferenceValidator {
  constructor(citationValidator, urlValidator) {
    this.citationValidator = citationValidator
    this.urlValidator = urlValidator
  }

  validate(citationReference) {
    const errors = CitationReferenceValidator.blankErrors()

    if (!citationReference) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(citationReference.id)

    if (has(citationReference, 'citation')) {
      errors.fieldErrors.citation = this.citationValidator.validate(citationReference.citation)
      if (errors.fieldErrors.citation.hasErrors) {
        errors.hasErrors = true
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.citation.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    }

    if (has(citationReference, 'urls')) {
      if (!isArray(citationReference.urls)) {
        errors.hasErrors = true
        errors.fieldErrors.urls.modelErrors.push(modelErrorCodes.IF_PRESENT_MUST_BE_ARRAY)
      } else {
        errors.fieldErrors.urls.itemErrors = map(citationReference.urls, this.urlValidator.validate)
        if (some(errors.fieldErrors.urls.itemErrors, i => i.hasErrors)) {
          errors.hasErrors = true
        }
      }
    }

    return errors
  }
}
CitationReferenceValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    quote: [],
    citation: {
      modelErrors: [],
      fieldErrors: {},
    },
    urls: {
      modelErrors: [],
      itemErrors: [],
    }
  },
})

class UrlValidator {
  validate(url) {
    const errors = UrlValidator.blankErrors()

    // A url can be blank (we will ignore it) but if present, it must be valid
    if (url.url) {
      try {
        urlParser.parse(url.url);
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

class CitationValidator {
  validate(citation) {
    const errors = CitationValidator.blankErrors()

    if (!citation) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (citation.text === '') {
      errors.hasErrors = true
      errors.fieldErrors.text.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!citation.text) {
      errors.hasErrors = true
      errors.fieldErrors.text.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
CitationValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    text: []
  },
})

class UserValidator {
  validate(user) {
    const errors = UserValidator.blankErrors()

    if (!user) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (user.email === '') {
      errors.hasErrors = true
      errors.fieldErrors.email.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!user.email) {
      errors.hasErrors = true
      errors.fieldErrors.email.push(modelErrorCodes.IS_REQUIRED)
    }

    if (user.password === '') {
      errors.hasErrors = true
      errors.fieldErrors.password.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!user.password) {
      errors.hasErrors = true
      errors.fieldErrors.password.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
UserValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    email: [],
    password: []
  }
})

class VoteValidator {
  validate(vote) {
    const errors = VoteValidator.blankErrors()

    if (!vote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (!vote.targetType) {
      errors.hasErrors = true
      errors.fieldErrors.targetType.push(modelErrorCodes.IS_REQUIRED)
    }

    if (!vote.targetId) {
      errors.hasErrors = true
      errors.fieldErrors.targetId.push(modelErrorCodes.IS_REQUIRED)
    }

    if (!vote.polarity) {
      errors.hasErrors = true
      errors.fieldErrors.polarity.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
VoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    targetType: [],
    targetId: [],
    polarity: [],
  }
})

const urlValidator = new UrlValidator()
const userValidator = new UserValidator()
const statementValidator = new StatementValidator()
const citationValidator = new CitationValidator()
const citationReferenceValidator = new CitationReferenceValidator(citationValidator, urlValidator)
const justificationValidator = new JustificationValidator(statementValidator, citationReferenceValidator)
const credentialValidator = new CredentialValidator()
const voteValidator = new VoteValidator()

module.exports = {
  statementValidator,
  citationReferenceValidator,
  justificationValidator,
  credentialValidator,
  userValidator,
  voteValidator,
}
