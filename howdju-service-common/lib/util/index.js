const {assign} = require('lodash')

module.exports = assign(
  {},
  require('./apiUtil'),
  require('./testUtil')
)
