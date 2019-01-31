const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./arguments'),
  require('./codes'),
  require('./enums'),
  require('./commonErrors'),
  require('./general'),
  require('./httpMethods'),
  require('./httpStatusCodes'),
  require('./models'),
  require('./schemas'),
  require('./schemaValidation'),
  require('./serialization'),
  require('./urls')
)
