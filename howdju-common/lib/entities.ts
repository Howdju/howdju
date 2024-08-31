/** Types describing fundamental concepts in our domain. */

import {
  Entity,
  Justification,
  Proposition,
  SourceExcerpt,
} from "./zodSchemas";

/** The value of an entity's `id` property. */
export type EntityId = string;

/** @deprecated Use {@link PropositionAppearance} instead. */
export interface SourceExcerptParaphrase extends Entity {
  paraphrasingProposition: Proposition;
  sourceExcerpt: SourceExcerpt;
}

export type CounteredJustification = Justification & {
  counterJustifications?: Justification[];
};

export interface Perspective extends Entity {
  proposition: Proposition;
}

/**
 * An opaque pagination token from the API.
 *
 * Encodes sorting, offset, etc. */
export type ContinuationToken = string;

/**
 *  A token authorizing clients to take actions as users.
 *
 * Clients must:
 *
 *  - not persist them
 *  - keep them secret
 *  - expire them on the order of several hours to 1 day
 *
 * The server must also enforce expirations that are not client-based.
 */
export type AuthToken = string;

/**
 * A token that can be used to refresh an {@link AuthToken}.
 *
 * Clients should persist these securely. An example of acceptable storage is a
 * secure, HTTP-only cookie.
 *
 * Clients must:
 *
 *  - keep them secret
 *  - expire them on the order of several days to 1 month.
 *
 * The server must also enforce expirations that are not client-based.
 */
export type AuthRefreshToken = string;

/**
 * A timestamp .
 *
 * I think this is an ISO 8601 datetime format
 *
 * Example: 2022-11-25T17:43:19.876Z */
export type DatetimeString = string;
