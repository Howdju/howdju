import { AuthToken } from "howdju-common";

/**
 * Info sufficient to identify a user
 *
 * At least one of the fields must be present.
 */
export interface UserIdent {
  authToken?: AuthToken;
  userId?: string;
}
