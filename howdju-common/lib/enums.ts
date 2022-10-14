export const EntityTypes = {
  JUSTIFICATION: 'JUSTIFICATION',
  JUSTIFICATION_VOTE: 'JUSTIFICATION_VOTE',
  PASSWORD_HASH: 'PASSWORD_HASH',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PROPOSITION: 'PROPOSITION',
  PROPOSITION_TAG_VOTE: 'PROPOSITION_TAG_VOTE',
  REGISTRATION_REQUEST: 'REGISTRATION_REQUEST',
  STATEMENT: 'STATEMENT',
  USER: 'USER',
  WRIT: 'WRIT',
  WRIT_QUOTE: 'WRIT_QUOTE',
} as const
export type EntityType = typeof EntityTypes[keyof typeof EntityTypes]

export const ActionTypes = {
  /** The user created something */
  CREATE: 'CREATE',
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  TRY_CREATE_DUPLICATE: 'TRY_CREATE_DUPLICATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSOCIATE: 'ASSOCIATE',
  DISASSOCIATE: 'DISASSOCIATE',
} as const

export const ActionTargetTypes = {
  PROPOSITION: 'PROPOSITION',
  PROPOSITION_COMPOUND: 'PROPOSITION_COMPOUND',
  JUSTIFICATION: 'JUSTIFICATION',
  JUSTIFICATION_BASIS_COMPOUND: 'JUSTIFICATION_BASIS_COMPOUND',
  JUSTIFICATION_BASIS_COMPOUND_ATOM: 'JUSTIFICATION_BASIS_COMPOUND_ATOM',
  SOURCE_EXCERPT_PARAPHRASE: 'SOURCE_EXCERPT_PARAPHRASE',
  WRIT_QUOTE: 'WRIT_QUOTE',
  WRIT: 'WRIT',
  PIC_REGION: 'PIC_REGION',
  PIC: 'PIC',
  VID_SEGMENT: 'VID_SEGMENT',
  VID: 'VID',
  USER: 'USER',
  URL: 'URL',
} as const

export const ActionSubjectType = {
  URL: 'URL',
} as const

export const JustificationRootTargetTypes = {
  PROPOSITION: 'PROPOSITION',
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION',
} as const
export type JustificationRootTargetType = typeof JustificationRootTargetTypes[keyof typeof JustificationRootTargetTypes]
// A justification can target anything that can be a root target.
// Additionally, it can target other justifications to counter them.
export const JustificationTargetTypes = {
  PROPOSITION: 'PROPOSITION',
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION',
} as const
export type JustificationTargetType = typeof JustificationTargetTypes[keyof typeof JustificationTargetTypes]

export const JustificationPolarities = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
} as const
export type JustificationPolarity = typeof JustificationPolarities[keyof typeof JustificationPolarities]
// For now they have the same values, but let's at least keep track of the usages separately
export const JustificationRootPolarities = JustificationPolarities
export type JustificationRootPolarity = typeof JustificationRootPolarities[keyof typeof JustificationRootPolarities]

export const JustificationBasisTypes = {
  /* One or more propositions */
  PROPOSITION_COMPOUND: 'PROPOSITION_COMPOUND',
  /**
   * A quote from a written source
   *
   * @deprecated Use SOURCE_EXCERPT's WRIT_QUOTE type instead.
   */
  WRIT_QUOTE: 'WRIT_QUOTE',
  /** An except from some fixed media. See {@link SourceExcerpt} */
  SOURCE_EXCERPT: 'SOURCE_EXCERPT',
  /* One or more {@see JustificationBasisCompoundAtomTypes}
   *
   * This type will replace the others
   * 
   * @deprecated
   */
  JUSTIFICATION_BASIS_COMPOUND: 'JUSTIFICATION_BASIS_COMPOUND',
} as const
export type JustificationBasisType = typeof JustificationBasisTypes[keyof typeof JustificationBasisTypes]
/**
 * Anything you can start with to create a justification based upon.
 *
 * (Which would include JustificationBasisTypes, too, but right now we are only adding those here that aren't also JustificationBasisTypes)
 *
 * TODO: this should go into a client package since only clients are concerned with translating
 * a source into a Justification.
 */
export const JustificationBasisSourceTypes = {
  /* One or more propositions */
  PROPOSITION_COMPOUND: 'PROPOSITION_COMPOUND',
  /* A quote */
  WRIT_QUOTE: 'WRIT_QUOTE',
  /* One or more {@see JustificationBasisCompoundAtomTypes}
   *
   * This type will replace the others
   */
  JUSTIFICATION_BASIS_COMPOUND: 'JUSTIFICATION_BASIS_COMPOUND',
  PROPOSITION: 'PROPOSITION',
  SOURCE_EXCERPT_PARAPHRASE: 'SOURCE_EXCERPT_PARAPHRASE',
} as const
export type JustificationBasisSourceType =  typeof JustificationBasisSourceTypes[keyof typeof JustificationBasisSourceTypes]

/** @deprecated */
export const JustificationBasisCompoundAtomTypes = {
  PROPOSITION: 'PROPOSITION',
  SOURCE_EXCERPT_PARAPHRASE: 'SOURCE_EXCERPT_PARAPHRASE',
} as const
/** @deprecated */
export type JustificationBasisCompoundAtomType = typeof JustificationBasisCompoundAtomTypes[keyof typeof JustificationBasisCompoundAtomTypes]

export const SourceExcerptTypes = {
  WRIT_QUOTE: 'WRIT_QUOTE',
  PIC_REGION: 'PIC_REGION',
  VID_SEGMENT: 'VID_SEGMENT',
} as const
export type SourceExcerptType = typeof SourceExcerptTypes[keyof typeof SourceExcerptTypes]

export const JustificationVotePolarities = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
} as const
export type JustificationVotePolarity = typeof JustificationVotePolarities[keyof typeof JustificationVotePolarities]
export const PropositionTagVotePolarities = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
} as const
export type PropositionTagVotePolarity = typeof PropositionTagVotePolarities[keyof typeof PropositionTagVotePolarities]

export const SortDirections = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
} as const

export const JustificationScoreTypes = {
  GLOBAL_VOTE_SUM: 'GLOBAL_VOTE_SUM',
} as const

export const PropositionTagScoreTypes = {
  GLOBAL_VOTE_SUM: 'GLOBAL_VOTE_SUM',
} as const

export const JobHistoryStatuses = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const

export const PropositionCompoundAtomTypes = {
  PROPOSITION: 'PROPOSITION',
} as const

export const ValidJustificationSearchFilters = [
  'writQuoteId',
  'writId',
  'propositionCompoundId',
  'sourceExcerptParaphraseId',
  'propositionId',
  'url',
] as const

export const SentenceTypes = {
  PROPOSITION: 'PROPOSITION',
  STATEMENT: 'STATEMENT',
} as const
export type SentenceType = typeof SentenceTypes[keyof typeof SentenceTypes]

export const UrlTargetAnchorTypes = {
  TEXT_QUOTE: 'TEXT_QUOTE',
} as const
export type UrlTargetAnchorType = typeof UrlTargetAnchorTypes[keyof typeof UrlTargetAnchorTypes]

export const ContentReportTypes = {
  HARASSMENT: "HARASSMENT",
  THREATENING_VIOLENCE: "THREATENING_VIOLENCE",
  HATEFUL: "HATEFUL",
  OBSCENE: "OBSCENE",
  SEXUALIZATION_OF_MINORS: "SEXUALIZATION_OF_MINORS",
  SHARING_PRIVATE_PERSONAL_INFORMATION: "SHARING_PRIVATE_PERSONAL_INFORMATION",
  PORNOGRAPHY: "PORNOGRAPHY",
  ILLEGAL_ACTIVITY: "ILLEGAL_ACTIVITY",
  IMPERSONATION: "IMPERSONATION",
  COPYRIGHT_VIOLATION: "COPYRIGHT_VIOLATION",
  TRADEMARK_VIOLATION: "TRADEMARK_VIOLATION",
  SPAM: "SPAM",
  OTHER: "OTHER",
} as const
export type ContentReportType = typeof ContentReportTypes[keyof typeof ContentReportTypes]
