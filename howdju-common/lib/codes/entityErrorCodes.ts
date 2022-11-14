/** Errors returned as the the values of a JSON body for an error HTTP status indicating what problem there was with
 * the model at that path
 */
export const EntityErrorCodes = {
  /** Another user has registered this username */
  USERNAME_TAKEN: "USERNAME_TAKEN",

  /** Another user has registered this email */
  EMAIL_TAKEN: "EMAIL_TAKEN",
} as const;
export type EntityErrorCode =
  typeof EntityErrorCodes[keyof typeof EntityErrorCodes];
