const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./arguments'),
  require('./codes'),
  require('./consts'),
  require('./commonPaths'),
  require('./entities'),
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

if (process.env.NODE_ENV === "test") {
  const {doTests} = require('./schemaValidation.testlib')
  module.exports.doSchemaValidationTests = doTests
}
