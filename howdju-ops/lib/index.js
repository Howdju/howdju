const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./env'),
  require('./lambda'),
  require('./logger'),
  require('./nodePlatforms')
)
