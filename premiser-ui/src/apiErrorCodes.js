module.exports = {
  /** The request lacks authentication credentials */
  UNAUTHENTICATED: 'UNAUTHENTICATED',

  /** The data submitted was invalid */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',

  INVALID_LOGIN_CREDENTIALS: 'INVALID_LOGIN_CREDENTIALS',

  /** The principle authenticated by the request lacks authority to perform the action */
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',

  /** The request would conflict with one or more other entities
   * (e.g. a user tries to update one statement's text to a value equal to another statement's text)
   */
  ENTITY_CONFLICT: 'ENTITY_CONFLICT',

  /** The request would conflict with one or more other users' actions
   * (e.g. a user tries to edit a statement after other users have added justifications to it)
   */
  USER_ACTIONS_CONFLICT: 'USER_ACTIONS_CONFLICT',

  NOT_FOUND: 'NOT_FOUND',

  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
}
