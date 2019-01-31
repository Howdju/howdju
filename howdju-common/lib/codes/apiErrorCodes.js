const {arrayToObject} = require('../general')

/** Explain why a particular HTTP Status occurred */
const apiErrorCodes = arrayToObject([
  /** The request lacks authentication credentials */
  'UNAUTHENTICATED',

  /** The data submitted was invalid */
  'VALIDATION_ERROR',

  'AUTHENTICATION_ERROR',

  /** The user tried to login with invalid login credentials */
  'INVALID_LOGIN_CREDENTIALS',

  /** The principle authenticated by the request lacks authority to perform the action */
  'AUTHORIZATION_ERROR',

  /** The user account is inactive.  Should only respond with this if the correct password was provided */
  'USER_IS_INACTIVE_ERROR',

  /** The request would conflict with one or more other entities
   * (e.g. a user tries to update one proposition's text to a value equal to another proposition's text)
   */
  'ENTITY_CONFLICT',

  /** The request would conflict with one or more other users' actions
   * (e.g. a user tries to edit a proposition after other users have added justifications to it)
   */
  'USER_ACTIONS_CONFLICT',

  /** An entity whose existence was entailed by the request was not found.  The API may return information
   * about the type and identifier of the missing entity, but may not for privacy or security reasons
   */
  'ENTITY_NOT_FOUND',
  
  /** The requested resource expired, or a dependent resource expired making fulfilling the request impossible */
  'EXPIRED',

  /** The requested resource was already used */
  'CONSUMED',

  /** The requested route was not found */
  'ROUTE_NOT_FOUND',

  'UNEXPECTED_ERROR',
])

module.exports = {
  apiErrorCodes
}
