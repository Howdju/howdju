const { modelErrorCodes } = require("howdju-common");

class CredentialValidator {
  validate(credentials) {
    const errors = CredentialValidator.blankErrors();

    if (!credentials) {
      errors.hasErrors = true;
      errors.modelErrors.push(modelErrorCodes.IS_REQUIRED);
      return errors;
    }

    if (credentials.email === "") {
      errors.hasErrors = true;
      errors.fieldErrors.email.push(modelErrorCodes.MUST_BE_NONEMPTY);
    } else if (!credentials.email) {
      errors.hasErrors = true;
      errors.fieldErrors.email.push(modelErrorCodes.IS_REQUIRED);
    }

    if (credentials.password === "") {
      errors.hasErrors = true;
      errors.fieldErrors.password.push(modelErrorCodes.MUST_BE_NONEMPTY);
    } else if (!credentials.password) {
      errors.hasErrors = true;
      errors.fieldErrors.password.push(modelErrorCodes.IS_REQUIRED);
    }

    return errors;
  }
}
CredentialValidator.blankErrors = () => ({
  hasErrors: false,
  modelErrors: [],
  fieldErrors: {
    email: [],
    password: [],
  },
});

exports.CredentialValidator = CredentialValidator;
