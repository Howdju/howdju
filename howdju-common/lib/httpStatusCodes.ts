/** See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *  See https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 *  See https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
 */
export const httpStatusCodes = {
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

  /**
   * The request conflicts with the server state.
   *
   * E.g., tried to create a user having the same username.
   */
  CONFLICT: 409,

  ERROR: 500,
} as const;
export type HttpStatusCode =
  typeof httpStatusCodes[keyof typeof httpStatusCodes];
