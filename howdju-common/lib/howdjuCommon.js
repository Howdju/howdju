const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./arguments'),
  require('./codes'),
  require('./enums'),
  require('./commonErrors'),
  require('./general'),
  require('./models'),
  require('./serialization')
)
