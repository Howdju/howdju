const assign = require('lodash/assign')
module.exports = assign(
  {},
  require('./apiErrorCodes'),
  require('./authorizationErrorCodes'),
  require('./entityConflictCodes'),
  require('./entityErrorCodes'),
  require('./modelErrorCodes'),
  require('./userActionsConflictCodes')
)
