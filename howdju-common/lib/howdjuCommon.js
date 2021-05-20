const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./arguments'),
  require('./codes'),
  require('./commonPaths'),
  require('./enums'),
  require('./commonErrors'),
  require('./general'),
  require('./httpMethods'),
  require('./httpStatusCodes'),
  require('./logger'),
  require('./models'),
  require('./schemas'),
  require('./schemaValidation'),
  require('./standaloneValidation'),
  require('./serialization'),
  require('./urls')
)
