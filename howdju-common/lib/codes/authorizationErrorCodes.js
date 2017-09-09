const {arrayToObject} = require('../general')

const authorizationErrorCodes = arrayToObject([
  'CANNOT_MODIFY_OTHER_USERS_ENTITIES'
])

module.exports = {
  authorizationErrorCodes,
}
