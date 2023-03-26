/**
 * Models that define requests and responses to APIs.
 *
 * Requests often will contain CreateX or EditX models. Responses often will contain XOuts.
 * Where X is an Entity.
 */

import { ApiErrorCode } from "./codes";
import { ModelErrors } from "./zodError";
import {
  Entity,
  JustificationRef,
  JustificationVote,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  SourceExcerpt,
  Statement,
  Tag,
  TagVote,
  User,
  VidSegment,
  Writ,
  WritQuote,
} from "./zodSchemas";
import {
  EntityRef,
  Persisted,
  PersistedJustificationWithRootRef,
  PersistRelated,
} from "./zodSchemaTypes";

/**
 * An out model representing errors for any CRUD action.
 *
 * @typeparam T the shape of the In model. Determines the shape of the errors.
 */
export interface ErrorOut<T extends object> {
  /** The overall error code. */
  errorCode: ApiErrorCode;
  /** The errors corresponding to the in model. */
  errors: ModelErrors<T>;
}

export interface PropositionOut
  extends Persisted<Proposition>,
    TaggedEntityOut<Proposition> {
  justifications?: JustificationOut[];
  propositionTagVotes?: PropositionTagVoteOut[];
}

export type WritOut = Persisted<Writ>;

export type UserOut = Persisted<User>;

export type WritQuoteOut = Persisted<WritQuote>;
export type PicRegionOut = Persisted<PicRegion>;
export type VidSegmentOut = Persisted<VidSegment>;

export type SourceExcerptOut = Persisted<SourceExcerpt> &
  (
    | { type: "WRIT_QUOTE"; entity: WritQuoteOut }
    | { type: "PIC_REGION"; entity: PicRegionOut }
    | { type: "VID_SEGMENT"; entity: VidSegmentOut }
  );

export type StatementOut = Persisted<Statement>;
export type SentenceOut = PropositionOut | StatementOut;

export type CreatorBlurb = EntityRef<User> & Pick<Persisted<User>, "longName">;

export type JustificationOut = PersistedJustificationWithRootRef & {
  creator?: EntityRef<User>;
  /** Justifications countering this justification. */
  counterJustifications?: (JustificationRef | JustificationOut)[];
  /** The sorting score for the current user */
  score?: number;
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
};

export type JustificationRootTargetOut = (PropositionOut | StatementOut) &
  TaggedEntityOut & {
    justifications: JustificationOut[];
    // TODO make tags a view model and put the votes on them.
    // TODO (At the very least deduplicate between TaggedEntityViewModel.tagVotes)
    propositionTagVotes: PropositionTagVoteOut[];
  };

export type PropositionCompoundOut = Persisted<PropositionCompound>;

export type PropositionCompoundAtomOut =
  PersistRelated<PropositionCompoundAtom>;

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = TagVote;

export type PropositionTagVoteOut = Persisted<PropositionTagVote>;

export type TaggedEntityOut<T extends Entity = Entity> = Persisted<T> & {
  tags?: Tag[];
  // TODO put votes on tags and type it as a viewmodel
  tagVotes?: TagVoteViewModel[];
  recommendedTags?: Tag[];
};

export type JustificationFilterName =
  | typeof ExternalJustificationSearchFilters[number]
  | "justificationId";
export type JustificationFilters = Partial<
  Record<JustificationFilterName, string>
>;

/** The justification search filters that clients can send. */
export const ExternalJustificationSearchFilters = [
  "writQuoteId",
  "writId",
  // Justifications based on this PropositionCompound
  "propositionCompoundId",
  "sourceExcerptParaphraseId",
  // Justifications based on this proposition in a PropositionCompound
  "propositionId",
  "url",
] as const;
export type JustificationSearchFilters = {
  [key in typeof ExternalJustificationSearchFilters[number]]?: string;
};

export interface SortDescription {
  property: string;
  direction: "ascending" | "descending";
  /** For continuations, the sort should filter out this value and any before it according to `direction`. */
  value?: string;
}
