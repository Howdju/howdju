const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./Database'),
  require('./pg')
)