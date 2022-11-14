/** @deprecated TODO(26): replace with EmptyBespokeValidationErrors. */
export const genericModelBlankErrors = function genericModelBlankErrors() {
  return {
    hasErrors: false,
    modelErrors: [],
    fieldErrors: {},
  };
};
