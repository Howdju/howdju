const trim = require('lodash/trim')
const replace = require('lodash/replace')
const lowerCase = require('lodash/lowerCase')
const deburr = require('lodash/deburr')

exports.clean = text => {
  text = trim(text)
  text = replace(text, /\s+/g, ' ')
  return text
}
exports.normalize = text => {

  // Postgres SQL for the same
  // regexp_replace(lower(regexp_replace(trim(text), '\s+', ' ', 'g')), '[^[:alnum:][:space:]_]', '', 'g')
  text = exports.clean(text)
  text = lowerCase(text)
  text = replace(text, /\W/g, '')
  text = deburr(text)

  return text
}