const deburr = require('lodash/deburr')
const replace = require('lodash/replace')
const toLower = require('lodash/toLower')
const trim = require('lodash/trim')

const {assert} = require('../util')
const {
  JustificationTargetType,
} = require('howdju-models')

exports.cleanWhitespace = text => {
  text = trim(text)
  text = replace(text, /\s+/g, ' ')
  return text
}
exports.normalizeText = text => {

  // Postgres SQL for the same
  // regexp_replace(lower(regexp_replace(trim(text), '\s+', ' ', 'g')), '[^[:alnum:][:space:]_.]', '', 'g')
  text = toLower(text)
  text = deburr(text)
  text = replace(text, /[^\w\s]/g, '')
  text = exports.cleanWhitespace(text)

  return text
}

exports.groupRootJustifications = (rootStatementId, justification_rows) => {
  const rootJustifications = [], counterJustificationsByJustificationId = {}
  for (let justification_row of justification_rows) {
    // There are two types of justifications: those on the (root) statement, and counters
    if (justification_row.target_type === JustificationTargetType.STATEMENT) {
      assert(() => toString(justification_row.target_id) === rootStatementId)
      rootJustifications.push(justification_row)
    } else {
      assert( () => justification_row.target_type === JustificationTargetType.JUSTIFICATION)
      if (!counterJustificationsByJustificationId.hasOwnProperty(justification_row.target_id)) {
        counterJustificationsByJustificationId[justification_row.target_id] = []
      }
      counterJustificationsByJustificationId[justification_row.target_id].push(justification_row)
    }
  }
  return {
    rootJustifications,
    counterJustificationsByJustificationId,
  }
}