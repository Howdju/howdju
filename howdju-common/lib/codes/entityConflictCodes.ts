/** This should probably just be combined with EntityErrorCodes */
export const entityConflictCodes = {
  ANOTHER_PROPOSITION_HAS_EQUIVALENT_TEXT:
    "ANOTHER_PROPOSITION_HAS_EQUIVALENT_TEXT",
  ANOTHER_WRIT_HAS_EQUIVALENT_TITLE: "ANOTHER_WRIT_HAS_EQUIVALENT_TITLE",
  ANOTHER_WRIT_QUOTE_HAS_EQUIVALENT_QUOTE_TEXT:
    "ANOTHER_WRIT_QUOTE_HAS_EQUIVALENT_QUOTE_TEXT",
  ALREADY_EXISTS: "ALREADY_EXISTS",
} as const;
export type EntityConflictCode =
  typeof entityConflictCodes[keyof typeof entityConflictCodes];
