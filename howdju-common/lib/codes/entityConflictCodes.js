const {arrayToObject} = require('../general')

const entityConflictCodes = arrayToObject([
  'ANOTHER_STATEMENT_HAS_EQUIVALENT_TEXT',
  'ANOTHER_TEXTUAL_SOURCE_HAS_EQUIVALENT_TEXT',
  'ANOTHER_TEXTUAL_SOURCE_QUOTE_HAS_EQUIVALENT_QUOTE',
])

module.exports = {entityConflictCodes}