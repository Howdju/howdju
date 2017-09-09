const isArray = require('lodash/isArray')
const map = require('lodash/map')
const some = require('lodash/some')
const get = require('lodash/get')
const has = require('lodash/has')
const includes = require('lodash/includes')
const urlParser = require("url")

const {
  JustificationBasisType,
  JustificationPolarity,
  JustificationTargetType,
  isTruthy,
  modelErrorCodes,
} = require('howdju-common')

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
  constructor(statementValidator, statementCompoundValidator, writingQuoteValidator) {
    this.statementValidator = statementValidator
    this.statementCompoundValidator = statementCompoundValidator
    this.writingQuoteValidator = writingQuoteValidator
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
              case JustificationBasisType.WRITING_QUOTE:
                basisEntityErrors = this.writingQuoteValidator.validate(justification.basis.entity)
                break
              case JustificationBasisType.STATEMENT_COMPOUND:
                basisEntityErrors = this.statementCompoundValidator.validate(justification.basis.entity)
                break;
              default:
                throw newImpossibleError(`Unsupported JustificationBasisType: ${justification.basis.type}`)
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

class WritingQuoteValidator {
  constructor(writingValidator, urlValidator) {
    this.writingValidator = writingValidator
    this.urlValidator = urlValidator
  }

  validate(writingQuote) {
    const errors = WritingQuoteValidator.blankErrors()

    if (!writingQuote) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    const isExtant = isTruthy(writingQuote.id)

    if (has(writingQuote, 'writing')) {
      errors.fieldErrors.writing = this.writingValidator.validate(writingQuote.writing)
      if (errors.fieldErrors.writing.hasErrors) {
        errors.hasErrors = true
      }
    } else if (!isExtant) {
      errors.hasErrors = true
      errors.fieldErrors.source.modelErrors.push(modelErrorCodes.IS_REQUIRED)
    }

    if (has(writingQuote, 'urls')) {
      if (!isArray(writingQuote.urls)) {
        errors.hasErrors = true
        errors.fieldErrors.urls.modelErrors.push(modelErrorCodes.IF_PRESENT_MUST_BE_ARRAY)
      } else {
        errors.fieldErrors.urls.itemErrors = map(writingQuote.urls, this.urlValidator.validate)
        if (some(errors.fieldErrors.urls.itemErrors, i => i.hasErrors)) {
          errors.hasErrors = true
        }
      }
    }

    return errors
  }
}
WritingQuoteValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    quoteText: [],
    source: WritingValidator.blankErrors(),
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

class WritingValidator {
  validate(writing) {
    const errors = WritingValidator.blankErrors()

    if (!writing) {
      errors.hasErrors = true
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED)
      return errors
    }

    if (writing.title === '') {
      errors.hasErrors = true
      errors.fieldErrors.title.push(modelErrorCodes.MUST_BE_NONEMPTY)
    } else if (!writing.title) {
      errors.hasErrors = true
      errors.fieldErrors.title.push(modelErrorCodes.IS_REQUIRED)
    }

    return errors
  }
}
WritingValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    title: []
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

module.exports = {
  WritingValidator,
  WritingQuoteValidator,
  CredentialValidator,
  JustificationValidator,
  StatementValidator,
  StatementCompoundValidator,
  UrlValidator,
  UserValidator,
  VoteValidator,
}
