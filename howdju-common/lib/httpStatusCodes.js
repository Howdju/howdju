/** See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *  See https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 *  See https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
 */
exports.httpStatusCodes = {
  OK: 200,

  /** There was nothing to do and nothing new to return (does not allow a body) */
  NO_CONTENT: 204,

  /** The parameters/body supplied for the endpoint are improper */
  BAD_REQUEST: 400,

  /** The user is not authenticated, or improperly authenticated */
  UNAUTHORIZED: 401,

  /** The user is authenticated but not authorized; not allowed to perform the requested action, lacks permission */
  FORBIDDEN: 403,

  /** The requested resource, or some required resource, was not found */
  NOT_FOUND: 404,

  /** The request conflicts with the current server state.
   *
   * One use case is if a user tries to create an entity that has the same value for
   * some field that must be unique. For example if a user creates Proposition
   * having the same `text` as an existing Proposition.
   *
   * When possible, the server should respond with the existing entity that
   * caused the conflict. When possible, clients should try and handle the
   * response graceffully, such as re-using the existing entity for the same
   * action as the user intended or redirecting the user to the existing entity.
   * Clients should show an informational notice about the conflitc, such as a
   * toast.
   */
  CONFLICT: 409,

  ERROR: 500,
}
