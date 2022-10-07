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
}

export const ActionTypes = {
  /** The user created something */
  CREATE: 'CREATE',
  /** The user tried to create something that was a duplicate of something existing; nothing was created */
  TRY_CREATE_DUPLICATE: 'TRY_CREATE_DUPLICATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSOCIATE: 'ASSOCIATE',
  DISASSOCIATE: 'DISASSOCIATE',
}

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
}
export type JustificationTargetType = typeof JustificationTargetTypes[keyof typeof JustificationTargetTypes]

export const JustificationPolarities = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
} as const
export type JustificationPolarityType = typeof JustificationPolarities[keyof typeof JustificationPolarities]
// For now they have the same values, but let's at least keep track of the usages separately
export const JustificationRootPolarities = JustificationPolarities
export type JustificationRootPolarityType = typeof JustificationRootPolarities[keyof typeof JustificationRootPolarities]

export const JustificationBasisTypes = {
  /* One or more propositions */
  PROPOSITION_COMPOUND: 'PROPOSITION_COMPOUND',
  /**
   * A quote
   *
   * @deprecated Use SOURCE_EXCERPT instead.
   */
  WRIT_QUOTE: 'WRIT_QUOTE',
  /* One or more {@see JustificationBasisCompoundAtomTypes}
   *
   * This type will replace the others
   */
  JUSTIFICATION_BASIS_COMPOUND: 'JUSTIFICATION_BASIS_COMPOUND',
}
export type JustificationBasisType = typeof JustificationBasisTypes[keyof typeof JustificationBasisTypes]
// Anything you can start with to create a justification based upon.
// (Which would include JustificationBasisTypes, too, but right now we are only adding those here that aren't also JustificationBasisTypes)
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
}
export type JustificationBasisSourceType =  typeof JustificationBasisSourceTypes[keyof typeof JustificationBasisSourceTypes]

/** @deprecated */
export const JustificationBasisCompoundAtomTypes = {
  PROPOSITION: 'PROPOSITION',
  SOURCE_EXCERPT_PARAPHRASE: 'SOURCE_EXCERPT_PARAPHRASE',
}
/** @deprecated */
export type JustificationBasisCompoundAtomType = typeof JustificationBasisCompoundAtomTypes[keyof typeof JustificationBasisCompoundAtomTypes]

export const SourceExcerptTypes = {
  WRIT_QUOTE: 'WRIT_QUOTE',
  PIC_REGION: 'PIC_REGION',
  VID_SEGMENT: 'VID_SEGMENT',
}

export const JustificationVotePolarities = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}
export const PropositionTagVotePolarities = {
  POSITIVE: 'POSITIVE',
  NEGATIVE: 'NEGATIVE',
}
export type PropositionTagVotePolarity = typeof PropositionTagVotePolarities[keyof typeof PropositionTagVotePolarities]

export const SortDirections = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending',
}

export const JustificationScoreTypes = {
  GLOBAL_VOTE_SUM: 'GLOBAL_VOTE_SUM',
}

export const PropositionTagScoreTypes = {
  GLOBAL_VOTE_SUM: 'GLOBAL_VOTE_SUM',
}

export const JobHistoryStatuses = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
}

export const PropositionCompoundAtomTypes = {
  PROPOSITION: 'PROPOSITION',
}

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
}

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
