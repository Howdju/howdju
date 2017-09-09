const {arrayToObject} = require('../general')

const entityConflictCodes = arrayToObject([
  'ANOTHER_STATEMENT_HAS_EQUIVALENT_TEXT',
  'ANOTHER_WRIT_HAS_EQUIVALENT_TITLE',
  'ANOTHER_WRITING_QUOTE_HAS_EQUIVALENT_QUOTE_TEXT',
])

module.exports = {entityConflictCodes}