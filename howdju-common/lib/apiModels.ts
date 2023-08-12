/**
 * Models that define requests and responses to APIs.
 *
 * Requests often will contain CreateX or EditX models. Responses often will contain XOuts.
 * Where X is an Entity.
 */

import { Moment } from "moment";
import { MergeDeep } from "type-fest";

import { ApiErrorCode } from "./codes";
import { EntityId } from "./entities";
import { JustificationView } from "./viewModels";
import { ModelErrors } from "./zodError";
import {
  Entity,
  JustificationRef,
  JustificationVote,
  Persorg,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  Source,
  SourceExcerpt,
  MediaExcerpt,
  Statement,
  Tag,
  TagVote,
  Url,
  User,
  VidSegment,
  Writ,
  WritQuote,
  UrlLocator,
  MediaExcerptCitation,
} from "./zodSchemas";
import {
  EntityRef,
  Persisted,
  PersistedJustificationWithRootRef,
  PersistRelated,
  ToPersistedEntity,
} from "./zodSchemaTypes";

export type MediaExcerptOut = MergeDeep<
  ToPersistedEntity<MediaExcerpt>,
  {
    citations: MediaExcerptCitationOut[];
    locators: {
      urlLocators: UrlLocatorOut[];
    };
    speakers: PersorgOut[];
  }
>;

/** Conveys the status of a UrlLocator to a client. */
export type UrlLocatorAutoConfirmationStatus =
  | {
      status: "NEVER_TRIED";
    }
  | {
      status: "NEVER_FOUND";
      earliestNotFoundAt: Moment;
      latestNotFoundAt: Moment;
    }
  | {
      status: "FOUND";
      earliestFoundAt: Moment;
      latestFoundAt: Moment;
      foundQuotation: string;
    }
  | {
      status: "PREVIOUSLY_FOUND";
      earliestFoundAt: Moment;
      latestFoundAt: Moment;
      foundQuotation: string;
      earliestNotFoundAt: Moment;
      latestNotFoundAt: Moment;
    };

export interface UrlLocatorOut extends ToPersistedEntity<UrlLocator> {
  url: UrlOut;
  autoConfirmationStatus: UrlLocatorAutoConfirmationStatus;
}

export interface AppearanceOut {
  id: EntityId;
  mediaExcerpt: MediaExcerptOut;
  apparition: {
    type: "PROPOSITION";
    entity: PropositionOut;
  };
  created: Moment;
  creator: CreatorBlurb;
}

export type SourceOut = ToPersistedEntity<Source>;
export type MediaExcerptCitationOut = MediaExcerptCitation & {
  source: SourceOut;
};

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

export interface StatementOut extends Persisted<Statement> {
  justifications?: JustificationOut[];
}
export type SentenceOut = PropositionOut | StatementOut;

export type CreatorBlurb = EntityRef<User> & Pick<Persisted<User>, "longName">;

export type JustificationOut = PersistedJustificationWithRootRef & {
  creator?: EntityRef<User>;
  /** Justifications countering this justification. */
  counterJustifications?: (JustificationRef | JustificationView)[];
  /** The sorting score for the current user */
  score?: number;
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
};

export type UrlOut = ToPersistedEntity<Url>;

export type JustificationRootTargetOut = PropositionOut | StatementOut;

export type PropositionCompoundOut = Persisted<PropositionCompound>;

export type PropositionCompoundAtomOut =
  PersistRelated<PropositionCompoundAtom>;

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = TagVote;

export type PropositionTagVoteOut = Persisted<PropositionTagVote>;

export type TaggedEntityOut<T extends Entity = Entity> = Persisted<T> & {
  tags?: Tag[];
  // TODO(112) put votes on tags and type it as a viewmodel
  tagVotes?: TagVoteViewModel[];
  recommendedTags?: Tag[];
};

export type JustificationFilters = Partial<
  Record<typeof ExternalJustificationSearchFilters[number], string>
> & { justificationId?: string | string[] };

export type ToFilter<T extends readonly string[]> = {
  [key in T[number]]?: string;
};

/** The justification search filters that clients can send. */
export const ExternalJustificationSearchFilters = [
  "writQuoteId",
  "writId",
  // Justifications based on this PropositionCompound
  "propositionCompoundId",
  "mediaExcerptId",
  "sourceExcerptParaphraseId",
  // Justifications based on this proposition in a PropositionCompound
  "propositionId",
  "url",
] as const;
export type JustificationSearchFilters = ToFilter<
  typeof ExternalJustificationSearchFilters
>;

export const MediaExcerptSearchFilterKeys = [
  "creatorUserId",
  "speakerPersorgId",
  "sourceId",
  "domain",
  /**
   * Returns MediaExcerpts having URLs matching url.
   *
   * Matching means that the two are equal after removing the query parameters and fragment and
   * ignoring the trailing slash. Both the `url` and `canonical_url` are considered.
   */
  "url",
] as const;
export type MediaExcerptSearchFilter = ToFilter<
  typeof MediaExcerptSearchFilterKeys
>;

export interface SortDescription {
  property: string;
  direction: "ascending" | "descending";
  /** For continuations, the sort should filter out this value and any before it according to `direction`. */
  value?: string;
}

export type PersorgOut = Persisted<Persorg>;

export type TagOut = Persisted<Tag>;
