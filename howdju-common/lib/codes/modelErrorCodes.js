const {arrayToObject} = require('../general')

const modelErrorCodes = arrayToObject([
  'MUST_BE_NONEMPTY',
  'INVALID_VALUE',
  'IS_REQUIRED',
  'IF_PRESENT_MUST_BE_ARRAY',
  'INVALID_URL',
  'STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE',
])

module.exports = {
  modelErrorCodes
}