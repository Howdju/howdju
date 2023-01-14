export interface SortDescription {
  property: string;
  direction: string;
  /** For continuations, the sort should filter out this value and any before it according to `direction`. */
  value?: string;
}

export type JustificationFilterName =
  // Justifications based on this proposition in a PropositionCompound
  | "propositionId"
  // Justifications based on this PropositionCompound
  | "propositionCompoundId"
  | "sourceExcerptParaphraseId"
  | "writQuoteId"
  | "writId"
  | "justificationId"
  | "url";
export type JustificationFilters = Partial<
  Record<JustificationFilterName, string>
>;

export interface SqlClause {
  sql: string;
  args: any[];
}
