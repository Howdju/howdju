const {arrayToObject} = require('../general')

/** Supports our old custom validation system.  Should go away after switching all validation to JSON schemas */
const modelErrorCodes = arrayToObject([
  'MUST_BE_NONEMPTY',
  'INVALID_VALUE',
  'IS_REQUIRED',
  'IF_PRESENT_MUST_BE_ARRAY',
  'IF_PRESENT_MUST_BE_NONEMPTY',
  'INVALID_URL',
  'PROPOSITION_JUSTIFICATION_MUST_HAVE_PROPOSITION_TARGET_TYPE',
  'JUSTIFICATION_ROOT_PROPOSITION_ID_AND_TARGET_PROPOSITION_ID_MUST_BE_EQUAL',
])

module.exports = {
  modelErrorCodes
}
