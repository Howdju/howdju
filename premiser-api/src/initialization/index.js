const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./servicesInitialization'),
  require('./searchersInitialization'),
  require('./loggerInitialization'),
  require('./utilInitialization')
)