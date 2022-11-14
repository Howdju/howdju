const set = require("lodash/set");

exports.rethrowTranslatedErrors = (translationKey) => (error) => {
  const errors = {};
  set(errors, translationKey, error.errors);
  error.errors = errors;
  throw error;
};
