const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./apiGateway'),
  require('./daos'),
  require('./database'),
  require('./searchers'),
  require('./services'),
  require('./util'),
  require('./validators'),
  require('./serviceErrors')
)
