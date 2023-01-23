/**
 * Models that define requests and responses to APIs.
 *
 * Requests often will contain CreateX or EditX models. Responses often will contain XOuts.
 * Where X is an Entity.
 */

import { ApiErrorCode } from "./codes";
import { ContinuationToken } from "./entities";
import { ModelErrors } from "./zodError";
import {
  CreateJustification,
  CreateProposition,
  Entity,
  Justification,
  JustificationRef,
  JustificationRootTarget,
  JustificationVote,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  SourceExcerpt,
  Statement,
  Tag,
  TagVote,
  User,
  WritQuote,
} from "./zodSchemas";
import { EntityRef, Persisted, PersistRelated } from "./zodSchemaTypes";

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

export interface PostPropositionIn {
  proposition: CreateProposition;
}

export interface PostPropositionOut {
  proposition: PropositionOut;
}

export interface PostJustificationIn {
  justification: CreateJustification;
}

export interface PostJustificationOut {
  justification: Persisted<Justification>;
}

export interface GetPropositionOut {
  proposition: PropositionOut;
}

export interface GetPropositionsOut {
  propositions: PropositionOut[];
  continuationToken: ContinuationToken;
}

export interface PropositionOut
  extends Persisted<Proposition>,
    TaggedEntityOut<Proposition> {
  justifications?: JustificationOut[];
  propositionTagVotes?: PropositionTagVoteOut[];
}

export type WritQuoteOut = Persisted<WritQuote>;

export type StatementOut = Persisted<Statement>;

export type CreatorBlurb = EntityRef<User> & Pick<Persisted<User>, "longName">;

export type JustificationOut = MaterializedJustificationWithRootRef & {
  creator?: EntityRef<User>;
  // Justifications countering this justification.
  counterJustifications?: (JustificationRef | JustificationOut)[];
  // The sorting score for the current user
  score?: number;
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
};

/**
 * A Justification with persisted relations other than the root target, which is a ref.
 *
 * This type is suitable for returning out of an API.
 *
 * See PersistedJustificationWithRootRef, which is similar but allows persisted or ref relations.
 */
type MaterializedJustificationWithRootRef = Omit<
  Persisted<Justification>,
  "rootTarget" | "target" | "basis"
> & {
  rootTarget: EntityRef<JustificationRootTarget>;
  target:
    | {
        type: "PROPOSITION";
        entity: Persisted<Proposition>;
      }
    | {
        type: "STATEMENT";
        entity: Persisted<Statement>;
      }
    | {
        type: "JUSTIFICATION";
        entity: MaterializedJustificationWithRootRef;
      };
  basis:
    | {
        type: "PROPOSITION_COMPOUND";
        entity: Persisted<PropositionCompound>;
      }
    | { type: "SOURCE_EXCERPT"; entity: Persisted<SourceExcerpt> }
    | { type: "WRIT_QUOTE"; entity: Persisted<WritQuote> };
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
