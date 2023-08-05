/** Enum values that apply to all apps.
 *
 * Originally this file was where we defined all enums, including those relating to entity fields.
 * But now we can derive many or most of those from our Zod schemas. Note that some of the values in
 *this file should still be derived from our Zod schemas.
 */

export const ActionTypes = {
  /** The user created something */
  CREATE: "CREATE",
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  TRY_CREATE_DUPLICATE: "TRY_CREATE_DUPLICATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  ASSOCIATE: "ASSOCIATE",
  DISASSOCIATE: "DISASSOCIATE",
} as const;
export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

export const ActionTargetTypes = {
  PROPOSITION: "PROPOSITION",
  PROPOSITION_COMPOUND: "PROPOSITION_COMPOUND",
  JUSTIFICATION: "JUSTIFICATION",
  JUSTIFICATION_BASIS_COMPOUND: "JUSTIFICATION_BASIS_COMPOUND",
  JUSTIFICATION_BASIS_COMPOUND_ATOM: "JUSTIFICATION_BASIS_COMPOUND_ATOM",
  SOURCE_EXCERPT_PARAPHRASE: "SOURCE_EXCERPT_PARAPHRASE",
  WRIT_QUOTE: "WRIT_QUOTE",
  WRIT: "WRIT",
  PIC_REGION: "PIC_REGION",
  PIC: "PIC",
  VID_SEGMENT: "VID_SEGMENT",
  VID: "VID",
  USER: "USER",
  URL: "URL",
} as const;
export type ActionTargetType =
  typeof ActionTargetTypes[keyof typeof ActionTargetTypes];

export const ActionSubjectTypes = {
  URL: "URL",
} as const;
export type ActionSubjectType =
  typeof ActionSubjectTypes[keyof typeof ActionSubjectTypes];

/**
 * Anything you can start with to create a justification based upon.
 *
 * (Which would include JustificationBasisTypes, too, but right now we are only adding those here
 * that aren't also JustificationBasisTypes)
 */
export const JustificationBasisSourceTypes = {
  /* One or more propositions */
  PROPOSITION_COMPOUND: "PROPOSITION_COMPOUND",
  /** A quote
   *
   * @deprecated TODO(201)
   */
  WRIT_QUOTE: "WRIT_QUOTE",
  /**
   * One or more {@see JustificationBasisCompoundAtomTypes}
   *
   * @deprecated TODO(28)
   */
  JUSTIFICATION_BASIS_COMPOUND: "JUSTIFICATION_BASIS_COMPOUND",
  PROPOSITION: "PROPOSITION",
  /** @deprecated TODO(215) */
  SOURCE_EXCERPT_PARAPHRASE: "SOURCE_EXCERPT_PARAPHRASE",
  MEDIA_EXCERPT: "MEDIA_EXCERPT",
} as const;
export type JustificationBasisSourceType =
  typeof JustificationBasisSourceTypes[keyof typeof JustificationBasisSourceTypes];

export function isJustificationBasisSourceType(
  val: any
): val is JustificationBasisSourceType {
  return val in JustificationBasisSourceTypes;
}

/** @deprecated */
export const JustificationBasisCompoundAtomTypes = {
  PROPOSITION: "PROPOSITION",
  SOURCE_EXCERPT_PARAPHRASE: "SOURCE_EXCERPT_PARAPHRASE",
} as const;
/** @deprecated TODO(28) */
export type JustificationBasisCompoundAtomType =
  typeof JustificationBasisCompoundAtomTypes[keyof typeof JustificationBasisCompoundAtomTypes];

export const SortDirections = {
  ASCENDING: "ascending",
  DESCENDING: "descending",
} as const;
export type SortDirection = typeof SortDirections[keyof typeof SortDirections];

export const JustificationScoreTypes = {
  GLOBAL_VOTE_SUM: "GLOBAL_VOTE_SUM",
} as const;

export const PropositionTagScoreTypes = {
  GLOBAL_VOTE_SUM: "GLOBAL_VOTE_SUM",
} as const;

export const JobHistoryStatuses = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
} as const;

export const PropositionCompoundAtomTypes = {
  // What was I thinking of adding here? Statements?
  PROPOSITION: "PROPOSITION",
} as const;
