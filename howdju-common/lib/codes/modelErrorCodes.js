const {arrayToObject} = require('../general')

const modelErrorCodes = arrayToObject([
  'MUST_BE_NONEMPTY',
  'INVALID_VALUE',
  'IS_REQUIRED',
  'IF_PRESENT_MUST_BE_ARRAY',
  'INVALID_URL',
  'STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE',
  'JUSTIFICATION_ROOT_STATEMENT_ID_AND_TARGET_STATEMENT_ID_MUST_BE_EQUAL',
])

module.exports = {
  modelErrorCodes
}
