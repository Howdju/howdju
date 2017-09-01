const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./apiErrorCodes'),
  require('./authorizationErrorCodes'),
  require('./entityConflictCodes'),
  require('./modelErrorCodes'),
  require('./userActionsConflictCodes')
)
