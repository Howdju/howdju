/** See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *  See https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 */
module.exports = {
  OK: 200,

  /** There was nothing to do and nothing new to return (does not allow a body) */
  NO_CONTENT: 204,

  /** The parameters/body supplied for the endpoint are improper */
  BAD_REQUEST: 400,

  /** The user is not authenticated, or improperly authenticated */
  UNAUTHORIZED: 401,

  FORBIDDEN: 403,

  /** The user is authenticated, but lacks permission */
  NOT_FOUND: 404,

  ERROR: 500,
}