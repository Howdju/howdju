const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./loggerInitialization'),
  require('./servicesInitialization')
)
