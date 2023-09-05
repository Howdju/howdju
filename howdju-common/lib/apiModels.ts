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
import { ModelErrors } from "./zodError";
import {
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
  Tag,
  TagVote,
  Url,
  User,
  VidSegment,
  Writ,
  WritQuote,
  UrlLocator,
  MediaExcerptCitation,
  MediaExcerptSpeaker,
  PersistedEntity,
  JustificationPolarity,
} from "./zodSchemas";
import {
  EntityRef,
  Persisted,
  PersistedJustificationWithRootRef,
  ToPersistedEntity,
} from "./zodSchemaTypes";

export type MediaExcerptOut = MergeDeep<
  ToPersistedEntity<MediaExcerpt>,
  {
    citations: MediaExcerptCitationOut[];
    locators: {
      urlLocators: UrlLocatorOut[];
    };
    speakers: MediaExcerptSpeakerOut[];
    apparitionCount?: number;
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

export type AppearanceConfirmationStatus =
  | "CONFIRMED"
  | "DISCONFIRMED"
  | undefined;

export interface AppearanceOut {
  id: EntityId;
  mediaExcerpt: MediaExcerptOut;
  apparition: {
    type: "PROPOSITION";
    entity: PropositionOut;
  };
  confirmationStatus?: AppearanceConfirmationStatus;
  created: Moment;
  creator: CreatorBlurb;
}

export type SourceOut = ToPersistedEntity<Source>;
export type MediaExcerptCitationOut = MediaExcerptCitation & {
  source: SourceOut;
};

export type MediaExcerptSpeakerOut = MediaExcerptSpeaker & {
  persorg: PersorgOut;
  creator: CreatorBlurb;
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

export type JustificationCountMap = {
  [key in JustificationPolarity]?: number;
};

export interface PropositionOut
  extends Persisted<Proposition>,
    TaggedEntityOut {
  justifications?: JustificationOut[];
  propositionTagVotes?: PropositionTagVoteOut[];
  creator?: CreatorBlurb;
  rootJustificationCountByPolarity?: JustificationCountMap;
  appearanceCount?: number;
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

export type StatementOut = PersistedEntity &
  TaggedEntityOut & {
    speaker: PersorgOut;
    justifications?: JustificationOut[];
    created: Moment;
    creator: CreatorBlurb;
  } & (
    | {
        sentenceType: "PROPOSITION";
        sentence: PropositionOut;
      }
    | {
        sentenceType: "STATEMENT";
        sentence: StatementOut;
      }
  );
export type SentenceOut = PropositionOut | StatementOut;

export type CreatorBlurb = Pick<UserOut, "id" | "longName">;

/**
 * A justification returned from the API with only a ref to its root target.
 *
 * Appropriate for display along with other justifications, where the root target
 * will have been requested separately.
 */
export type JustificationOut = PersistedJustificationWithRootRef & {
  creator?: EntityRef<User>;
  /** Justifications countering this justification. */
  counterJustifications?: (JustificationRef | JustificationWithRootOut)[];
  /** The sorting score for the current user */
  score?: number;
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
};

/**
 * A JustificationOut with a full root target.
 *
 * Appropriate for display in lists where the root target will not have been separately requested.
 */
export type JustificationWithRootOut = Omit<
  JustificationOut,
  "rootTarget" | "rootTargetType" | "target" | "basis"
> &
  (
    | {
        rootTargetType: "PROPOSITION";
        rootTarget: PropositionOut;
      }
    | {
        rootTargetType: "STATEMENT";
        rootTarget: StatementOut;
      }
  ) & {
    target:
      | {
          type: "PROPOSITION";
          entity: PropositionOut;
        }
      | {
          type: "STATEMENT";
          entity: StatementOut;
        }
      | {
          type: "JUSTIFICATION";
          entity: JustificationWithRootOut;
        };
  } & {
    basis:
      | {
          type: "PROPOSITION_COMPOUND";
          entity: PropositionCompoundOut;
        }
      | {
          type: "MEDIA_EXCERPT";
          entity: MediaExcerptOut;
        }
      | {
          type: "WRIT_QUOTE";
          entity: WritQuoteOut;
        }
      | {
          type: "JUSTIFICATION_BASIS_COMPOUND";
          entity: PersistedEntity;
        };
  };

export type UrlOut = ToPersistedEntity<Url>;

export type JustificationRootTargetOut = PropositionOut | StatementOut;

export type PropositionCompoundOut = Persisted<PropositionCompound>;

export type PropositionCompoundAtomOut = PropositionCompoundAtom & {
  entity: PropositionOut;
};

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = TagVote;

export type PropositionTagVoteOut = Persisted<PropositionTagVote>;

/** A mixin type for Entities that can be tagged. */
export type TaggedEntityOut = PersistedEntity & {
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

export const AppearanceSearchFilterKeys = [
  "creatorUserId",
  "propositionId",
  "mediaExcerptId",
] as const;
export type AppearanceSearchFilter = ToFilter<
  typeof AppearanceSearchFilterKeys
>;

export interface SortDescription {
  property: string;
  direction: "ascending" | "descending";
  /** For continuations, the sort should filter out this value and any before it according to `direction`. */
  value?: string;
}

export type PersorgOut = Persisted<Persorg> & {
  creator?: CreatorBlurb;
};

export type TagOut = Persisted<Tag>;
