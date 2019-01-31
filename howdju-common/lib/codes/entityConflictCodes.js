const {arrayToObject} = require('../general')

/** This should probably just be combined with entityErrorCodes */
const entityConflictCodes = arrayToObject([
  'ANOTHER_PROPOSITION_HAS_EQUIVALENT_TEXT',
  'ANOTHER_WRIT_HAS_EQUIVALENT_TITLE',
  'ANOTHER_WRIT_QUOTE_HAS_EQUIVALENT_QUOTE_TEXT',
])

module.exports = {entityConflictCodes}