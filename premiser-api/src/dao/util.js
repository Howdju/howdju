const trim = require('lodash/trim')
const replace = require('lodash/replace')
const lowerCase = require('lodash/lowerCase')
const deburr = require('lodash/deburr')

exports.cleanWhitespace = text => {
  text = trim(text)
  text = replace(text, /\s+/g, ' ')
  return text
}
exports.normalizeText = text => {

  // Postgres SQL for the same
  // regexp_replace(lower(regexp_replace(trim(text), '\s+', ' ', 'g')), '[^[:alnum:][:space:]_]', '', 'g')
  text = exports.cleanWhitespace(text)
  text = lowerCase(text)
  text = replace(text, /[^\w\s]/g, '')
  text = deburr(text)

  return text
}