const {JustificationTargetType} = require("./models")

const isArray = require('lodash/isArray')
const map = require('lodash/map')
const some = require('lodash/some')
const url = require("url");

const MUST_BE_NONEMPTY = 'MUST_BE_NONEMPTY'
const IS_REQUIRED = 'IS_REQUIRED'
const IF_PRESENT_MUST_BE_ARRAY = 'IF_PRESENT_MUST_BE_ARRAY'
const INVALID_URL = 'INVALID_URL'
const STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE = 'STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE'

class CredentialValidator {
  validate(credentials) {
    const errors = {
      hasErrors: false,
      modelErrors: [],
      fieldErrors: {
        email: [],
        password: [],
      },
    }

    if (!credentials) {
      errors.hasErrors = true
      errors.modelErrors.push(IS_REQUIRED)
      return errors
    }

    if (credentials.email === '') {
      errors.hasErrors = true
      errors.fieldErrors.email.push(MUST_BE_NONEMPTY)
    } else if (!credentials.email) {
      errors.hasErrors = true
      errors.fieldErrors.email.push(IS_REQUIRED)
    }

    if (credentials.password === '') {
      errors.hasErrors = true
      errors.fieldErrors.password.push(MUST_BE_NONEMPTY)
    } else if (!credentials.password) {
      errors.hasErrors = true
      errors.fieldErrors.password.push(IS_REQUIRED)
    }

    return errors
  }
}

class StatementJustificationValidator {
  constructor(statementValidator, justificationValidator) {
    this.statementValidator = statementValidator
    this.justificationValidator = justificationValidator
  }

  validate(statementJustification) {
    const {
      statement,
      justification,
    } = statementJustification
    const statementErrors = this.statementValidator.validate(statement)
    const justificationErrors = justification ?
        this.justificationValidator.validate(justification) :
        JustificationValidator.defaultErrors

    if (justification && justification.target.type !== JustificationTargetType.STATEMENT) {
      justificationErrors.hasErrors = true
      justificationErrors.fieldErrors.target.fieldErrors.type.push(STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE)
    }

    return {
      hasErrors: statementErrors.hasErrors || justificationErrors.hasErrors,
      fieldErrors: {
        statement: statementErrors,
        justification: justificationErrors,
      }
    }
  }
}

class JustificationValidator {
  constructor(statementValidator, citationReferenceValidator) {
    this.statementValidator = statementValidator
    this.citationReferenceValidator = citationReferenceValidator
  }
  validate(justification) {
    // rootStatementId and polarity required
    // target type and EITHER ID required OR valid properties for type required
    // basis type and EITHER ID OR valid properties for type required
    /*

      if (
          !justification.rootStatementId ||
          !justification.polarity ||
          !justification.target ||
          !justification.target.type ||
          !justification.target.entity.id ||
          !justification.basis ||
          !justification.basis.type ||
          !justification.basis.entity
      ) {
        return {isInvalid: true}
      }
     */
    return JustificationValidator.defaultErrors
  }
}
JustificationValidator.defaultErrors = {
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
}

class StatementValidator {
  validate(statement) {
    const errors = {
      hasErrors: false,
      modelErrors: [],
      fieldErrors: {
        text: []
      },
    }

    if (!statement) {
      errors.hasErrors = true
      errors.modelErrors.push(IS_REQUIRED)
      return errors
    }

    if (statement.text === '') {
      errors.hasErrors = true
      errors.fieldErrors.text.push(MUST_BE_NONEMPTY)
    } else if (!statement.text) {
      errors.hasErrors = true
      errors.fieldErrors.text.push(IS_REQUIRED)
    }

    return errors
  }
}

class CitationReferenceValidator {
  constructor(citationValidator, urlValidator) {
    this.citationValidator = citationValidator
    this.urlValidator = urlValidator
  }

  validate(citationReference) {
    const errors = {
      hasErrors: false,
      modelErrors: [],
      fieldErrors: {
        citation: {
          modelErrors: [],
          fieldErrors: {},
        },
        urls: {
          modelErrors: [],
          itemErrors: [],
        }
      },
    }

    if (!citationReference) {
      errors.hasErrors = true
      errors.modelErrors.push(IS_REQUIRED)
      return errors
    }

    errors.fieldErrors.citation = this.citationValidator.validate(citationReference.citation)
    if (errors.fieldErrors.citation.hasErrors) {
      errors.hasErrors = true
    }

    if (citationReference.urls && !isArray(citationReference.urls)) {
      errors.hasErrors = true
      errors.fieldErrors.urls.modelErrors.push(IF_PRESENT_MUST_BE_ARRAY)
    } else {
      errors.fieldErrors.urls.itemErrors = map(citationReference.urls, this.urlValidator.validate)
      if (some(errors.fields.urls.items, i => i.hasErrors)) {
        errors.hasErrors = true
      }
    }

    return errors
  }
}

class UrlValidator {
  validate(url) {
    const errors = {
      hasErrors: false,
      modelErrors: [],
      fieldErrors: {
        url: []
      },
    }
    if (url.url === '') {
      errors.hasErrors = true
      errors.fieldErrors.url.push(MUST_BE_NONEMPTY)
    } else if (!url.url) {
      errors.hasErrors = true
      errors.fieldErrors.url.push(IS_REQUIRED)
    } else {
      try {
        url.parse(url.url);
      } catch (e) {
        errors.fieldErrors.url = INVALID_URL
      }
    }

    return errors
  }
}

class CitationValidator {
  validate(citation) {
    const errors = {
      hasErrors: false,
      modelErrors: [],
      fieldErrors: {
        text: []
      },
    }

    if (!citation) {
      errors.hasErrors = true
      errors.modelErrors.push(IS_REQUIRED)
      return errors
    }

    if (citation.text === '') {
      errors.hasErrors = true
      errors.fieldErrors.text.push(MUST_BE_NONEMPTY)
    } else if (!citation.text) {
      errors.hasErrors = true
      errors.fieldErrors.text.push(IS_REQUIRED)
    }

    return errors
  }
}

const statementValidator = new StatementValidator()
const citationReferenceValidator = new CitationReferenceValidator(new CitationValidator(), new UrlValidator())
const justificationValidator = new JustificationValidator(statementValidator, citationReferenceValidator)
const statementJustificationValidator = new StatementJustificationValidator(statementValidator, justificationValidator)
const credentialValidator = new CredentialValidator()

module.exports = {
  statementValidator,
  citationReferenceValidator,
  justificationValidator,
  statementJustificationValidator,
  credentialValidator,
}
