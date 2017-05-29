module.exports = {
  /** The request would conflict with one or more other entities
   * (e.g. a user tries to update one statement's text to a value equal to another statement's text)
   */
  ENTITY_CONFLICT_RESPONSE_CODE: 'ENTITY_CONFLICT_RESPONSE_CODE',

  /** The request would conflict with one or more other users' actions
   * (e.g. a user tries to edit a statement after other users have added justifications to it)
   */
  USER_ACTIONS_CONFLICT_RESPONSE_CODE: 'USER_ACTIONS_CONFLICT_RESPONSE_CODE',
}