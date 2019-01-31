const {arrayToObject} = require('../general')

/** Errors returned as the the values of a JSON body for an error HTTP status indicating what problem there was with
 * the model at that path
 */
const entityErrorCodes = arrayToObject([
  /** Another user has registered this username */
  'USERNAME_TAKEN',
  
  /** Another user has registered this email */
  'EMAIL_TAKEN',
])

module.exports = {entityErrorCodes}