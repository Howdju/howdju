/**
 * Zod validation schemas.
 *
 * Only things that we need to validate should go here. We must validate input to the
 * system, including form models and API request bodies. Values that represent database output, API
 * responses, and view models that we derive on the client do not require validation, although we
 * may benefit from defining them using Zod schemas.
 */

import { keys, omit } from "lodash";
import { Moment } from "moment";
import { Simplify } from "type-fest";
import { z } from "zod";

import { momentObject, urlString } from "./zodRefinements";
import { EntityName, EntityOrRef, EntityRef } from "./zodSchemaTypes";

/** A persisent conceptual entity */
export const Entity = z.object({
  // Entities have an ID after they have been persisted.
  id: z.string().optional(),
});
export type Entity = z.infer<typeof Entity>;

/**
 * Objects for creating an Entity.
 *
 * We use this as a marker type for helpers that translate between CreateEntity and Entity.
 *
 * E.g. CreateMediaExcerpt should not have an ID, but it corresponds to the entity MediaExcerpt and
 * in type helpers we want to be able to translate it to an Entity.
 *
 * TODO(452) replace Entity with CreateModel for Create/CreateInput models.
 */
export const CreateModel = z.object({
  _isCreateModel: z.boolean().optional(),
});
export type CreateModel = z.output<typeof CreateModel>;

export type PersistCreateModel<T extends CreateModel> = T & PersistedEntity;

const PersistedEntity = Entity.required();
export type PersistedEntity = z.infer<typeof PersistedEntity>;

export const UserExternalIds = z.object({
  googleAnalyticsId: z.string(),
  heapAnalyticsId: z.string(),
  mixpanelId: z.string(),
  sentryId: z.string(),
});
export type UserExternalIds = z.infer<typeof UserExternalIds>;

/** A user of the system */
export const User = Entity.extend({
  email: z.string().email().max(512),
  username: z
    .string()
    .regex(/[A-Za-z0-9_]+/)
    .min(3)
    .max(64),
  shortName: z.string().min(1).max(32).optional(),
  longName: z.string().min(1).max(64),
  // We currently don't request phone number
  phoneNumber: z.string().optional(),
  created: momentObject,
  isActive: z.boolean(),
  externalIds: UserExternalIds.optional(),
});
export type User = z.infer<typeof User>;

/**
 * An abbreviated form of a user.
 *
 * Often included to show an entities creator.
 */
export const UserBlurb = User.pick({
  longName: true,
}).merge(PersistedEntity);
export type UserBlurb = z.output<typeof UserBlurb>;

/**
 * A declarative statement of fact that the system tracks.
 *
 * Other systems might call this a claim.
 */
export const Proposition = Entity.extend({
  /**
   * The text of the proposition.
   *
   * Text should be a concise, neutral point of view, unambiguous, declarative independent clause.
   */
  text: z.string().min(1),
  created: momentObject,
});
export type Proposition = z.infer<typeof Proposition>;

export const UpdatePropositionInput = Proposition.merge(PersistedEntity).omit({
  created: true,
});
export type UpdatePropositionInput = z.infer<typeof UpdatePropositionInput>;
export const UpdateProposition = UpdatePropositionInput;
export type UpdateProposition = z.infer<typeof UpdateProposition>;

export const Tag = Entity.extend({
  name: z.string(),
});
export type Tag = z.infer<typeof Tag>;
export const CreateTag = Tag;
export type CreateTag = z.infer<typeof CreateTag>;
export const CreateTagInput = CreateTag;
export type CreateTagInput = z.infer<typeof CreateTagInput>;

const tagVotePolarities = z.enum(["POSITIVE", "NEGATIVE"]);
export type TagVotePolarity = z.infer<typeof tagVotePolarities>;

/** @deprecated replace with TagVote */
export const PropositionTagVote = z.lazy(() =>
  Entity.extend({
    proposition: z.union([Proposition, PropositionRef]),
    polarity: tagVotePolarities,
    tag: Tag,
  })
);
export type PropositionTagVote = z.infer<typeof PropositionTagVote>;
export type PropositionTagVotePolarity = PropositionTagVote["polarity"];
export const PropositionTagVotePolarities = tagVotePolarities.Enum;

export type CreatePropositionTagVote = {
  proposition: PropositionRef | CreateProposition;
  polarity: TagVotePolarity;
  tag: TagRef | CreateTag;
};
export const CreatePropositionTagVote: z.ZodType<CreatePropositionTagVote> =
  z.lazy(() =>
    Entity.extend({
      proposition: z.union([PropositionRef, CreateProposition]),
      polarity: tagVotePolarities,
      tag: z.union([TagRef, CreateTag]),
    })
  );
export type CreatePropositionTagVoteInput = {
  proposition: PropositionRef | CreateProposition;
  polarity: TagVotePolarity;
  tag: TagRef | CreateTag;
};
export const CreatePropositionTagVoteInput: z.ZodType<CreatePropositionTagVoteInput> =
  z.lazy(() =>
    Entity.extend({
      proposition: z.union([CreatePropositionInput, PropositionRef]),
      polarity: tagVotePolarities,
      tag: z.union([TagRef, CreateTagInput]),
    })
  );

export const CreatePropositionInput = Proposition.omit({
  created: true,
}).extend({
  tags: z.array(CreateTagInput).optional(),
  propositionTagVotes: z.array(CreatePropositionTagVoteInput).optional(),
});
export type CreatePropositionInput = z.infer<typeof CreatePropositionInput>;
export const CreateProposition = CreatePropositionInput.extend({
  tags: z.array(CreateTag).optional(),
  propositionTagVotes: z.array(CreatePropositionTagVote).optional(),
});
export type CreateProposition = CreatePropositionInput;

/** Something capable of making speech: a person or organization. */
export const Persorg = Entity.extend({
  isOrganization: z.boolean(),
  /** The person or organization's official or most well-known name. */
  name: z.string().min(1),
  /**
   * Why the person or organization is noteworthy.
   *
   * This field can help disambiguate persons with identical or similar names, or provide context on
   * the speaker's statements.
   *
   * Persorgs should respect privacy, and so generally the system should maintain only noteworthy
   * statements. A statement can be noteworthy because the person making it is generally noteworthy,
   * or because in the context it was made, it is noteworthy.
   */
  knownFor: z.string().optional(),
  /** The official or primary website representing the persorg. */
  websiteUrl: urlString().optional(),
  /** The persorg's Twitter. */
  twitterUrl: urlString({ domain: /twitter.com$/ }).optional(),
  /** The persorg's Wikipedia URL. */
  wikipediaUrl: urlString({ domain: /wikipedia.org$/ }).optional(),
  created: momentObject,
  creatorUserId: z.string(),
});
export type Persorg = z.infer<typeof Persorg>;

export const CreatePersorg = Persorg.omit({
  id: true,
  created: true,
  creatorUserId: true,
  creator: true,
});
export type CreatePersorg = z.infer<typeof CreatePersorg>;

export const CreatePersorgInput = CreatePersorg;
export type CreatePersorgInput = z.infer<typeof CreatePersorgInput>;

export const UpdatePersorg = Persorg.merge(PersistedEntity).omit({
  created: true,
  creatorUserId: true,
  creator: true,
});
export type UpdatePersorg = z.infer<typeof UpdatePersorg>;

export const UpdatePersorgInput = UpdatePersorg;
export type UpdatePersorgInput = z.infer<typeof UpdatePersorgInput>;

/** Represents an utterance of a proposition by a persorg. */
export type Statement = Entity & {
  speaker: Persorg;
  created: Moment;
} & (
    | {
        sentenceType: "PROPOSITION";
        sentence: Proposition;
      }
    | {
        sentenceType: "STATEMENT";
        sentence: Statement;
      }
  );
const sentenceTypes = z.enum(["PROPOSITION", "STATEMENT"]);
const baseStatement = {
  speaker: Persorg,
  created: momentObject,
};
export const Statement: z.ZodType<Statement> = z.lazy(() =>
  z.discriminatedUnion("sentenceType", [
    Entity.extend({
      sentenceType: z.literal(sentenceTypes.Enum.PROPOSITION),
      sentence: Proposition,
      ...baseStatement,
    }),
    Entity.extend({
      sentenceType: z.literal(sentenceTypes.Enum.STATEMENT),
      sentence: Statement,
      ...baseStatement,
    }),
  ])
);
export type Sentence = Statement["sentence"];
export type SentenceType = Statement["sentenceType"];
export const SentenceTypes = sentenceTypes.Enum;

export type CreateStatementInput = Entity & {
  speaker: CreatePersorgInput;
} & (
    | {
        sentenceType: "PROPOSITION";
        sentence: CreatePropositionInput;
      }
    | {
        sentenceType: "STATEMENT";
        sentence: CreateStatementInput;
      }
  );
export const CreateStatementInput: z.ZodType<CreateStatementInput> = z.lazy(
  () =>
    z.discriminatedUnion("sentenceType", [
      Entity.extend({
        sentenceType: z.literal(sentenceTypes.Enum.PROPOSITION),
        sentence: CreatePropositionInput,
        speaker: Persorg,
      }),
      Entity.extend({
        sentenceType: z.literal(sentenceTypes.Enum.STATEMENT),
        sentence: CreateStatementInput,
        speaker: Persorg,
      }),
    ])
);

export type CreateStatement = Entity & {
  speaker: CreatePersorg;
} & (
    | {
        sentenceType: "PROPOSITION";
        sentence: CreateProposition;
      }
    | {
        sentenceType: "STATEMENT";
        sentence: CreateStatement;
      }
  );
export const CreateStatement: z.ZodType<CreateStatement> = z.lazy(() =>
  z.discriminatedUnion("sentenceType", [
    Entity.extend({
      sentenceType: z.literal(sentenceTypes.Enum.PROPOSITION),
      sentence: CreateProposition,
      speaker: CreatePersorg,
    }),
    Entity.extend({
      sentenceType: z.literal(sentenceTypes.Enum.STATEMENT),
      sentence: CreateStatement,
      speaker: CreatePersorg,
    }),
  ])
);
// Statement has no Update models; users can edit the proposition/statement or the speaker.

/** Textual media. */
export const Writ = Entity.extend({
  title: z.string().min(1).max(512),
  created: momentObject,
});
export type Writ = z.infer<typeof Writ>;

export const CreateWrit = Writ.omit({
  created: true,
});
export type CreateWrit = z.infer<typeof CreateWrit>;

export const CreateWritInput = CreateWrit;
export type CreateWritInput = z.infer<typeof CreateWritInput>;

export const UpdateWrit = Writ;
export type UpdateWrit = z.infer<typeof UpdateWrit>;
export const UpdateWritInput = UpdateWrit;
export type UpdateWritInput = z.infer<typeof UpdateWritInput>;

/**
 * A reference to a portion of a URL document.
 */
export const DomAnchor = z.object({
  /**
   * The text this anchor targets
   *
   * See dom-anchor-text-quote.
   */
  exactText: z.string(),
  /**
   * The text appearing before the exactText
   *
   * See dom-anchor-text-quote.
   */
  prefixText: z.string(),
  /**
   * The text appearing after the exactText
   *
   * See dom-anchor-text-quote.
   */
  suffixText: z.string(),
  /**
   * The character offset of the beginning of exactText in the DOM
   *
   * See dom-anchor-text-position.
   */
  startOffset: z.number(),
  /**
   * The character offset of the end of exactText in the DOM
   *
   * See dom-anchor-text-position.
   */
  endOffset: z.number(),
  urlLocatorId: z.string(),
  created: momentObject,
  creatorUserId: z.string(),
});
export type DomAnchor = z.infer<typeof DomAnchor>;

export const CreateDomAnchor = DomAnchor.omit({
  created: true,
  creatorUserId: true,
  urlLocatorId: true,
});
export type CreateDomAnchor = z.output<typeof CreateDomAnchor>;

/** @deprecated */
export const UrlTarget = Entity.extend({
  anchors: z.array(DomAnchor),
});
/** @deprecated */
export type UrlTarget = z.infer<typeof UrlTarget>;

export const Url = Entity.extend({
  url: urlString(),
  /** If the user provides the canonical URL, we will confirm it. */
  canonicalUrl: urlString().optional(),
  /** @deprecated TODO(38) replace with UrlLocator.anchors */
  target: UrlTarget.optional(),
});
export type Url = z.infer<typeof Url>;

export const CreateUrl = Url.omit({
  target: true,
});
export type CreateUrl = z.infer<typeof CreateUrl>;
export const CreateUrlInput = CreateUrl;
export type CreateUrlInput = z.infer<typeof CreateUrlInput>;

export const UrlLocator = Entity.extend({
  mediaExcerptId: z.string(),
  url: Url,
  // If we have inferred a text fragment URL for the UrlLocator based on its MediaExcerpt's localRep.
  textFragmentUrl: urlString().optional(),
  anchors: z.array(DomAnchor).optional(),
  created: momentObject,
  creatorUserId: z.string(),
  creator: UserBlurb,
});
export type UrlLocator = z.output<typeof UrlLocator>;

/** A reference to a part of a textual media. */
export const WritQuote = Entity.extend({
  quoteText: z.string().min(1).max(4096),
  writ: Writ,
  urls: z.array(Url),
  created: momentObject,
});
export type WritQuote = z.infer<typeof WritQuote>;

/** A reference to a part of a fixed visual media. */
export const PicRegion = Entity;
export type PicRegion = z.infer<typeof PicRegion>;

/** A reference to a part of a video medium */
export const VidSegment = Entity;
export type VidSegment = z.infer<typeof VidSegment>;

/** A reference to a part of an audio medium */
export const AudSegment = Entity;
export type AudSegment = z.infer<typeof AudSegment>;

const sourceExcerptTypes = z.enum(["WRIT_QUOTE", "PIC_REGION", "VID_SEGMENT"]);
/**
 * An excerpt of some fixed media.
 *
 * @deprecated use MediaExcerpt. SourceExcerpt was a bad name since it has no property
 * relating it to a source.
 */
export const SourceExcerpt = z.discriminatedUnion("type", [
  Entity.extend({
    type: z.literal(sourceExcerptTypes.Enum.WRIT_QUOTE),
    entity: WritQuote,
  }),
  Entity.extend({
    type: z.literal(sourceExcerptTypes.Enum.PIC_REGION),
    entity: PicRegion,
  }),
  Entity.extend({
    type: z.literal(sourceExcerptTypes.Enum.VID_SEGMENT),
    entity: VidSegment,
  }),
]);
/** @deprecated TODO(38) replace with MediaExcerpt */
export type SourceExcerpt = z.infer<typeof SourceExcerpt>;
/** @deprecated TODO(38) replace with MediaExcerpt */
export type SourceExcerptType = SourceExcerpt["type"];
/** @deprecated See SourceExcerpt */
export const SourceExcerptTypes = sourceExcerptTypes.Enum;

export const CreateUrlLocator = UrlLocator.omit({
  id: true,
  mediaExcerptId: true,
  created: true,
  creatorUserId: true,
  creator: true,
}).extend({
  url: CreateUrl,
  anchors: z.array(CreateDomAnchor).optional(),
});
export type CreateUrlLocator = z.output<typeof CreateUrlLocator>;

export const CreateUrlLocatorInput = CreateUrlLocator;
export type CreateUrlLocatorInput = z.output<typeof CreateUrlLocatorInput>;

/** A source of information */
export const Source = Entity.extend({
  /**
   * A description of the source.
   *
   * The preferred style is MLA-like, but omitting the Authors:
   *
   * - The title of the source comes first and should be in quotes unless it is the only field.
   * - The date format should be ISO 8601 (YYYY-MM-DD) unless:
   *   - the source frequently omits the month and year, such as in academic journals, in which
   *     case the year is sufficient.
   *   - the source is updated frequently, in which case including the time is recommended.
   *
   * Because we can't guarantee that users will follow this style, we will later need a means
   * to vote on preferred manifestations of Sources.
   *
   * Examples:
   *
   * - “Russia Accuses Prigozhin of Trying to Mount a Coup: Live Updates” The New York Times (2023-06-23)
   * - “Comparison of Blood and Brain Mercury Levels in Infant Monkeys Exposed to Methylmercury or Vaccines Containing Thimerosal” Environmental Health Perspectives vol. 113,8 (2005): 1015. doi:10.1289/ehp.7712
   */
  description: z.string().min(1).max(1024),
  normalDescription: z.string().max(1024),
  created: momentObject,
  deleted: momentObject.optional(),
  creatorUserId: z.string(),
  creator: UserBlurb,
});
export type Source = z.output<typeof Source>;

export const CreateSource = Source.omit({
  normalDescription: true,
  created: true,
  deleted: true,
  creator: true,
  creatorUserId: true,
});
export type CreateSource = z.output<typeof CreateSource>;

export const CreateSourceInput = CreateSource;
export type CreateSourceInput = z.output<typeof CreateSourceInput>;

export const UpdateSource = CreateSource.extend({
  id: z.string(),
});
export type UpdateSource = z.output<typeof UpdateSource>;

export const UpdateSourceInput = UpdateSource;
export type UpdateSourceInput = z.output<typeof UpdateSourceInput>;

/**
 * A description of how to find a particular part of a source.
 *
 * A SourcePincite can be associated with a Source in the context of an excerpt.
 * The pincite locates where in the source the appearance occurs. Examples are:
 * page number, minute/second offset (for temporal sources like audio/video.)
 */
export const MediaExcerptCitation = z.object({
  mediaExcerptId: z.string(),
  source: Source,
  pincite: z.string().min(1).max(64).optional(),
  normalPincite: z.string().min(1).max(64).optional(),
  created: momentObject,
  creatorUserId: z.string(),
});
export type MediaExcerptCitation = z.output<typeof MediaExcerptCitation>;

export const CreateMediaExcerptCitation = MediaExcerptCitation.extend({
  source: CreateSource,
}).omit({
  // A CreateMediaExcerptCitation must be associated with a CreateMediaExcerpt, the ID of which
  // will be substituted for the mediaExcerptId.
  mediaExcerptId: true,
  normalPincite: true,
  created: true,
  creatorUserId: true,
});
export type CreateMediaExcerptCitation = z.output<
  typeof CreateMediaExcerptCitation
>;

export const CreateMediaExcerptCitationInput =
  CreateMediaExcerptCitation.extend({
    source: CreateSourceInput,
    // An empty pincite translates to null upon creation.
    pincite: z.string().max(64).optional(),
  });
export type CreateMediaExcerptCitationInput = z.output<
  typeof CreateMediaExcerptCitationInput
>;

/**
 * A model identifying MediaExcerptCitations for deletion.
 *
 * Since MediaExcerptCitation is a relation and not an Entity (and so has no singular unique ID), we
 * need a model to uniquely identify it for deletion.
 */
export const DeleteMediaExcerptCitation = z.object({
  mediaExcerptId: z.string(),
  source: z.object({
    id: z.string(),
  }),
  normalPincite: z.string().optional(),
});
export type DeleteMediaExcerptCitation = z.output<
  typeof DeleteMediaExcerptCitation
>;

export const MediaExcerptSpeaker = z.object({
  mediaExcerptId: z.string(),
  persorg: Persorg,
  created: momentObject,
  creatorUserId: z.string(),
});
export type MediaExcerptSpeaker = z.output<typeof MediaExcerptSpeaker>;

export const CreateMediaExcerptSpeaker = MediaExcerptSpeaker.extend({
  persorg: CreatePersorg,
}).omit({
  // A CreateMediaExcerptSpeaker must be associated with a CreateMediaExcerpt, the ID of which
  // will be substituted for the mediaExcerptId.
  mediaExcerptId: true,
  created: true,
  creatorUserId: true,
});
export type CreateMediaExcerptSpeaker = z.output<
  typeof CreateMediaExcerptSpeaker
>;

export const CreateMediaExcerptSpeakerInput = CreateMediaExcerptSpeaker;
export type CreateMediaExcerptSpeakerInput = z.output<
  typeof CreateMediaExcerptSpeakerInput
>;

/**
 * A representation of an excerpt of some fixed media conveying speech. *
 *
 * Two MediaExcerpts are equivalent if they represent the same 'speech act'. A 'speech act' is a
 * single event of a particular speaker saying a particular thing at a particular time. The
 * MediaExcerpts are only equivalent if the media represents the same direct speech. For example,
 * if two translators translate the same speech into different languages, MediaExcerpts of those
 * translations are not necessarily equivalent because the translators may have introduced their own
 * interpretation on top of the original speech.
 *
 * The same speaker saying the same thing at a different time is a different speech act.
 *
 * Two MediaExcerpts are equivalent if they represent the same speech in the same part of the same
 * source. For example, two MediaExcerpts are equivalent if they represent the same speech in the
 * same part of the same video, even if they are different resolutions or cropped differently.
 * However, two MediaExcerpts are not equivalent if they represent the same speech in different
 * parts of the same video.
 *
 */
export const MediaExcerpt = Entity.extend({
  /**
   * One or more local representations of the excerpt.
   *
   * If there is more than one representation, they must all represent the same
   * part of the source and the same speech. (What do we do if they don't?)
   *
   * Potential additional fields:
   *
   * Text-based:
   *  - focusText: a part of quotation that is the substance of the excerpt, while the rest of
   *    quotation provides additional context. The focusText must appear within the quotation.
   *  - contextText: text that encompasses the focusText to provie additional context, but which
   *    does not convey the substance of the excerpt.
   *  - description: a textual description of non-textual content. Like an img alt text. (How do
   *    users provite signal for an inaccurate description? The more literal the localRep, the less
   *    possibility for interpretation.)
   *  - transcription: text that appears in an image or as speech in audio/video. (Should we just
   *    reuse quotation for this?)
   * Image-based:
   *  - screenshot: a screenshot of the text in situ.
   *  - copied low-res image with optional highlighted focused region
   *  - copied image cropped to focused region
   *  - embedded picture with optional focused region
   * Video-based:
   *  - copied low-res video cropped to focused segment
   *  - embedded video (with offset if possible)
   * Audio-based:
   *  - embedded audio (with offset if possible)
   */
  localRep: z.object({
    /**
     * Text or speech that literally appears in the media and conveys the substance of the speech.
     *
     * Users may use this field either for focusText or for contextText (as described above.) It's
     * an open question how we would migrate this field to a focusText/contextText split if we
     * decided to do that.
     *
     * For textual media, this text must appear in the media. For audio and video media, this
     * text must be a transcription of the speech that appears in the media.
     */
    quotation: z.string().min(1).max(4096),
    normalQuotation: z.string().min(1).max(4096),
  }),
  /**
   * Provides a procedure for locating the local representation in situ remotely.
   *
   * Currently only urlLocators, but possibly in the future: ThirdPartyContentId
   * (YouTube Video ID, Tweet ID, Facebook Post ID.), scripted web browser actions
   * (e.g. navigate to URL, click on expander, highlight DomAnchor to reveal excerpt.)
   */
  locators: z.object({
    /** A way to locate a source excerpt at a part of a URL resource. */
    urlLocators: z.array(UrlLocator),
  }),
  /**
   * Sources users have identified as represented (at least in part) by the source excerpt.
   *
   * The locators may point to online copies or excerpts of other sources, such as books or journal
   * articles, such as when a news article quotes a journal article or a blog post quotes a book.
   * The source field allows associating that source with the in situ appearance of the
   * mediaExcerpt at the locators.
   */
  citations: z.array(MediaExcerptCitation),
  /** Persorgs to whom users have attributed the speech in the source excerpt. */
  speakers: z.array(MediaExcerptSpeaker),
  created: momentObject,
  creatorUserId: z.string(),
  creator: UserBlurb,
});
export type MediaExcerpt = z.output<typeof MediaExcerpt>;

export const Appearance = Entity.extend({
  /**
   * Where the entity appears.
   */
  mediaExcerpt: MediaExcerpt,
  /**
   * The entity that appears at the MediaExcerpt.
   *
   * We can make this a discriminatedUnion on type to support additional appearing entities.
   */
  apparition: z.object({
    type: z.literal("PROPOSITION"),
    entity: Proposition,
  }),
});
export type Appearance = z.output<typeof Appearance>;

export const CreateAppearance = z.object({
  mediaExcerptId: z.string(),
  apparition: z.object({
    type: z.literal("PROPOSITION"),
    entity: CreateProposition,
  }),
});
export type CreateAppearance = z.output<typeof CreateAppearance>;

export const CreateAppearanceInput = z.object({
  mediaExcerptId: z.string(),
  apparition: z.object({
    type: z.literal("PROPOSITION"),
    entity: CreatePropositionInput,
  }),
});
export type CreateAppearanceInput = z.output<typeof CreateAppearanceInput>;

export const ConfirmationStatusPolarity = z.enum(["POSITIVE", "NEGATIVE"]);
export type ConfirmationStatusPolarity = z.output<
  typeof ConfirmationStatusPolarity
>;
export const CreateAppearanceConfirmation = z.object({
  appearanceId: z.string(),
  /** Tracks appearance_vote_polarity. */
  polarity: ConfirmationStatusPolarity,
});
export type CreateAppearanceConfirmation = z.output<
  typeof CreateAppearanceConfirmation
>;

export const PropositionCompoundAtom = z.object({
  /**
   * A reference to this atom's parent compound.
   *
   * TODO(440) do we need this?
   */
  propositionCompoundId: z.string(),
  entity: Proposition,
});
export type PropositionCompoundAtom = z.infer<typeof PropositionCompoundAtom>;

/* One or more propositions intended to be considered conjunctively */
export const PropositionCompound = Entity.extend({
  atoms: z.array(PropositionCompoundAtom).min(1),
  created: momentObject.optional(),
  creatorUserId: z.string().optional(),
});
export type PropositionCompound = z.infer<typeof PropositionCompound>;

export const CreatePropositionCompoundAtomInput = z.object({
  entity: CreatePropositionInput,
});
export type CreatePropositionCompoundAtomInput = z.infer<
  typeof CreatePropositionCompoundAtomInput
>;

export const UpdatePropositionCompoundAtomInput = z.object({
  entity: UpdatePropositionInput,
});
export type UpdatePropositionCompoundAtomInput = z.infer<
  typeof UpdatePropositionCompoundAtomInput
>;

export const CreatePropositionCompoundInput = Entity.extend({
  atoms: z.array(CreatePropositionCompoundAtomInput).min(1),
});
export type CreatePropositionCompoundInput = z.infer<
  typeof CreatePropositionCompoundInput
>;

export const CreatePropositionCompoundAtom = z.object({
  entity: CreateProposition,
});
export type CreatePropositionCompoundAtom = z.infer<
  typeof CreatePropositionCompoundAtom
>;

export const UpdatePropositionCompoundAtom = z.object({
  entity: UpdateProposition,
});
export type UpdatePropositionCompoundAtom = z.infer<
  typeof UpdatePropositionCompoundAtom
>;

export const CreatePropositionCompound = Entity.extend({
  atoms: z.array(CreatePropositionCompoundAtom).min(1),
});
export type CreatePropositionCompound = z.infer<
  typeof CreatePropositionCompound
>;

export const UpdatePropositionCompoundInput = Entity.extend({
  atoms: z.array(UpdatePropositionCompoundAtomInput).min(1),
});
export type UpdatePropositionCompoundInput = z.infer<
  typeof UpdatePropositionCompoundInput
>;
export const UpdatePropositionCompound = Entity.extend({
  atoms: z.array(UpdatePropositionCompoundAtom).min(1),
});
export type UpdatePropositionCompound = z.infer<
  typeof UpdatePropositionCompound
>;

export const JustificationPolarity = z.enum(["POSITIVE", "NEGATIVE"]);
export type JustificationPolarity = z.infer<typeof JustificationPolarity>;
export const JustificationPolarities = JustificationPolarity.Enum;

export const RelationPolarity = z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]);
export type RelationPolarity = z.infer<typeof RelationPolarity>;

export const JustificationRootPolarity = z.enum(["POSITIVE", "NEGATIVE"]);
export type JustificationRootPolarity = z.infer<
  typeof JustificationRootPolarity
>;
export const JustificationRootPolarities = JustificationRootPolarity.Enum;

/**
 * A reason for believing some truth valence about a target.
 *
 * For example, a reason for believing that a proposition is true.
 *
 * Some systems might call this evidence.
 *
 * Technically the root target information can be derived from following the chain of targets, and so it
 * should appear only in the storage and view models. But we include it here for expedience since it
 * often useful to have it in the models and we assumed it was present in the entity originally. But
 * perhaps in the future we could remove rootPolarity, rootTarget, and rootTargetType from the
 * entity and include it in just those models that need it. Models that require it include the data
 * model (to make it possible to query all of a root target's justifications) and view and input
 * models (to make it possible to display the justification propertly.) Before we do that, we
 * probably want to refactor the root target info to be a single discriminated property rootTarget
 * (including type and entity).
 */
export type Justification = Entity & {
  // A justification can target anything that can be a root target.
  // Additionally, it can target other justifications to counter them.
  target:
    | {
        type: "PROPOSITION";
        entity: Proposition;
      }
    | {
        type: "STATEMENT";
        entity: Statement;
      }
    | {
        type: "JUSTIFICATION";
        entity: Justification;
      };
  polarity: JustificationPolarity;
  basis:
    | {
        type: "PROPOSITION_COMPOUND";
        entity: PropositionCompound;
      }
    | {
        type: "MEDIA_EXCERPT";
        entity: MediaExcerpt;
      }
    /* @deprecated TODO(38) Replace with MediaExcerpt */
    | {
        type: "SOURCE_EXCERPT";
        entity: SourceExcerpt;
      }
    /**
     * A quote from a written source
     *
     * @deprecated TODO(38) Replace with MediaExcerpt
     */
    | {
        type: "WRIT_QUOTE";
        entity: WritQuote;
      };
  rootPolarity: JustificationRootPolarity;
  created: Moment;
} & (
    | {
        rootTargetType: "PROPOSITION";
        rootTarget: Proposition;
      }
    | {
        rootTargetType: "STATEMENT";
        rootTarget: Statement;
      }
  );
export type CounterJustification = Justification & {
  target: { type: "JUSTIFICATION" };
  polarity: "NEGATIVE";
};
export const JustificationBasisType = z.enum([
  "PROPOSITION_COMPOUND",
  "MEDIA_EXCERPT",
  "SOURCE_EXCERPT",
  /** @deprecated */
  "WRIT_QUOTE",
  /**
   * A mixture of Propositions and WritQuotes.
   *
   * @deprecated We decided not to mix 'claims' (Propositions) and 'evidence' (SourceExcerpts).
   * Instead, a justification must be a PropositionCompound or a SourceExcerpt.
   */
  "JUSTIFICATION_BASIS_COMPOUND",
]);
export const JustificationBasisTypes = JustificationBasisType.Enum;
// Fields that can be shared across the rootTargetType discriminatedUntion
const justificationBaseShape = {
  polarity: JustificationPolarity,
  basis: z.discriminatedUnion("type", [
    z.object({
      type: z.literal(JustificationBasisTypes.PROPOSITION_COMPOUND),
      entity: PropositionCompound,
    }),
    z.object({
      type: z.literal("MEDIA_EXCERPT"),
      entity: MediaExcerpt,
    }),
    z.object({
      type: z.literal(JustificationBasisTypes.SOURCE_EXCERPT),
      entity: SourceExcerpt,
    }),
  ]),
  rootPolarity: JustificationRootPolarity,
  created: momentObject,
};
export const JustificationRootTargetType = z.enum(["PROPOSITION", "STATEMENT"]);
export const JustificationRootTargetTypes = JustificationRootTargetType.Enum;
export const JustificationTargetType = z.enum([
  "PROPOSITION",
  "STATEMENT",
  "JUSTIFICATION",
]);
export const Justification: z.ZodType<Justification> = z.lazy(() =>
  z.discriminatedUnion("rootTargetType", [
    Entity.extend({
      ...justificationBaseShape,
      rootTargetType: z.literal(JustificationRootTargetTypes.PROPOSITION),
      rootTarget: Proposition,
      target: z.discriminatedUnion("type", [
        z.object({
          type: z.literal(JustificationTargetType.Enum.PROPOSITION),
          entity: Proposition,
        }),
        z.object({
          type: z.literal(JustificationTargetType.Enum.STATEMENT),
          entity: Statement,
        }),
        z.object({
          type: z.literal(JustificationTargetType.Enum.JUSTIFICATION),
          entity: Justification,
        }),
      ]),
    }),
    Entity.extend({
      ...justificationBaseShape,
      rootTargetType: z.literal(JustificationRootTargetTypes.STATEMENT),
      rootTarget: Statement,
      target: z.discriminatedUnion("type", [
        z.object({
          type: z.literal(JustificationTargetType.Enum.PROPOSITION),
          entity: Proposition,
        }),
        z.object({
          type: z.literal(JustificationTargetType.Enum.STATEMENT),
          entity: Statement,
        }),
        z.object({
          type: z.literal(JustificationTargetType.Enum.JUSTIFICATION),
          entity: Justification,
        }),
      ]),
    }),
  ])
);
export type JustificationBasis = Justification["basis"];
export type JustificationBasisType = Justification["basis"]["type"];
export type JustificationTarget = Justification["target"];
export type JustificationTargetType = Justification["target"]["type"];
export type JustificationRootTarget = Justification["rootTarget"];
export type JustificationRootTargetType = Justification["rootTargetType"];
export const JustificationTargetTypes = JustificationTargetType.Enum;

export const PropositionRef =
  Entity.required().brand<EntityName<Proposition>>();
export type PropositionRef = z.infer<typeof PropositionRef>;

export const StatementRef = Entity.required().brand<EntityName<Statement>>();
export type StatementRef = z.infer<typeof StatementRef>;

export const JustificationRef =
  Entity.required().brand<EntityName<Justification>>();
export type JustificationRef = z.infer<typeof JustificationRef>;

export const JustificationVoteRef =
  Entity.required().brand<EntityName<JustificationVote>>();
export type JustificationVoteRef = z.infer<typeof JustificationVoteRef>;

export const PropositionCompoundRef =
  Entity.required().brand<"PropositionCompound">();
export type PropositionCompoundRef = z.infer<typeof PropositionCompoundRef>;

export const SourceExcerptRef =
  Entity.required().brand<EntityName<SourceExcerpt>>();
export type SourceExcerptRef = z.infer<typeof SourceExcerptRef>;

export const WritQuoteRef = Entity.required().brand<EntityName<WritQuote>>();
export type WritQuoteRef = z.infer<typeof WritQuoteRef>;

export const WritRef = Entity.required().brand<EntityName<Writ>>();
export type WritRef = z.infer<typeof WritRef>;

export const PersorgRef = Entity.required().brand<EntityName<Persorg>>();
export type PersorgRef = z.infer<typeof Persorg>;

export const TagRef = Entity.required().brand<EntityName<Tag>>();
export type TagRef = z.infer<typeof TagRef>;

export const TagVoteRef = Entity.required().brand<EntityName<TagVote>>();
export type TagVoteRef = z.infer<typeof TagVoteRef>;

export const UrlRef = Entity.required().brand<EntityName<Url>>();
export type UrlRef = z.infer<typeof UrlRef>;

export const UserRef = Entity.required().brand<EntityName<User>>();
export type UserRef = z.infer<typeof UserRef>;

export const PropositionTagVoteRef =
  Entity.required().brand<EntityName<PropositionTagVote>>();
export type PropositionTagVoteRef = z.infer<typeof PropositionTagVoteRef>;

export const RegistrationRequestRef =
  Entity.required().brand<EntityName<RegistrationRequest>>();
export type RegistrationRequestRef = z.infer<typeof RegistrationRequestRef>;

export const PasswordResetRequestRef =
  Entity.required().brand<EntityName<PasswordResetRequest>>();
export type PasswordResetRequestRef = z.infer<typeof PasswordResetRequestRef>;

export const AccountSettingsRef =
  Entity.required().brand<EntityName<AccountSettings>>();
export type AccountSettingsRef = z.infer<typeof AccountSettingsRef>;

export const ContentReportRef =
  Entity.required().brand<EntityName<ContentReport>>();
export type ContentReportRef = z.infer<typeof ContentReportRef>;

export const UrlLocatorRef = Entity.required().brand<EntityName<UrlLocator>>();
export type UrlLocatorRef = z.infer<typeof UrlLocatorRef>;

export const MediaExcerptRef =
  Entity.required().brand<EntityName<MediaExcerpt>>();
export type MediaExcerptRef = z.output<typeof MediaExcerptRef>;

export const SourceRef = Entity.required().brand<EntityName<Source>>();
export type SourceRef = z.infer<typeof SourceRef>;

/*
 * Entities lacking alternatives don't require special Create/Update models
 */

/** @deprecated prefer MediaExcerpt */
export const CreateWritQuoteInput = Entity.extend({
  quoteText: WritQuote.shape.quoteText,
  writ: CreateWritInput,
  urls: z.array(CreateUrlInput),
});
/** @deprecated prefer MediaExcerpt */
export type CreateWritQuoteInput = z.infer<typeof CreateWritQuoteInput>;
/** @deprecated prefer MediaExcerpt */
export const CreateWritQuote = CreateWritQuoteInput;
/** @deprecated prefer MediaExcerpt */
export type CreateWritQuote = z.infer<typeof CreateWritQuote>;

/** @deprecated prefer MediaExcerpt */
export const UpdateWritQuoteInput = WritQuote;
/** @deprecated prefer MediaExcerpt */
export type UpdateWritQuoteInput = z.infer<typeof UpdateWritQuoteInput>;
/** @deprecated prefer MediaExcerpt */
export const UpdateWritQuote = WritQuote.merge(PersistedEntity);
/** @deprecated prefer MediaExcerpt */
export type UpdateWritQuote = z.infer<typeof UpdateWritQuote>;

/** @deprecated prefer MediaExcerpt */
export const CreateVidSegmentInput = VidSegment;
/** @deprecated prefer MediaExcerpt */
export type CreateVidSegmentInput = z.infer<typeof CreateVidSegmentInput>;
/** @deprecated prefer MediaExcerpt */
export const CreateVidSegment = VidSegment;
/** @deprecated prefer MediaExcerpt */
export type CreateVidSegment = z.infer<typeof CreateVidSegment>;

/** @deprecated prefer MediaExcerpt */
export const CreateAudSegmentInput = AudSegment;
/** @deprecated prefer MediaExcerpt */
export type CreateAudSegmentInput = z.infer<typeof CreateAudSegmentInput>;
/** @deprecated prefer MediaExcerpt */
export const CreateAudSegment = AudSegment;
/** @deprecated prefer MediaExcerpt */
export type CreateAudSegment = z.infer<typeof CreateAudSegment>;

/** @deprecated prefer MediaExcerpt */
export const UpdateVidSegmentInput = VidSegment;
/** @deprecated prefer MediaExcerpt */
export type UpdateVidSegmentInput = z.infer<typeof UpdateVidSegmentInput>;
/** @deprecated prefer MediaExcerpt */
export const UpdateVidSegment = VidSegment;
/** @deprecated prefer MediaExcerpt */
export type UpdateVidSegment = z.infer<typeof UpdateVidSegment>;

/** @deprecated prefer MediaExcerpt */
export const CreatePicRegionInput = PicRegion;
/** @deprecated prefer MediaExcerpt */
export type CreatePicRegionInput = z.infer<typeof CreatePicRegionInput>;
/** @deprecated prefer MediaExcerpt */
export const CreatePicRegion = PicRegion;
/** @deprecated prefer MediaExcerpt */
export type CreatePicRegion = z.infer<typeof CreatePicRegion>;

/** @deprecated prefer MediaExcerpt */
export const UpdatePicRegionInput = PicRegion;
/** @deprecated prefer MediaExcerpt */
export type UpdatePicRegionInput = z.infer<typeof UpdatePicRegionInput>;
/** @deprecated prefer MediaExcerpt */
export const UpdatePicRegion = PicRegion;
/** @deprecated prefer MediaExcerpt */
export type UpdatePicRegion = z.infer<typeof UpdatePicRegion>;

/** @deprecated */
export const CreateSourceExcerptInput = Entity.extend({
  type: z.enum(["WRIT_QUOTE", "PIC_REGION", "VID_SEGMENT"]),
  writQuote: CreateWritQuoteInput,
  picRegion: CreatePicRegionInput,
  vidSegment: CreateVidSegmentInput,
});
export type CreateSourceExcerptInput = z.infer<typeof CreateSourceExcerptInput>;
export const CreateSourceExcerpt = z.discriminatedUnion("type", [
  Entity.extend({
    type: z.literal("WRIT_QUOTE"),
    entity: CreateWritQuote,
  }),
  Entity.extend({
    type: z.literal("PIC_REGION"),
    entity: CreatePicRegion,
  }),
  Entity.extend({
    type: z.literal("VID_SEGMENT"),
    entity: CreateVidSegment,
  }),
]);
/** @deprecated */
export type CreateSourceExcerpt = z.infer<typeof CreateSourceExcerpt>;

const CreateMediaExcerptBase = MediaExcerpt.omit({
  id: true,
  created: true,
  creatorUserId: true,
  creator: true,
})
  .merge(CreateModel)
  .extend({
    localRep: MediaExcerpt.shape.localRep.omit({ normalQuotation: true }),
    locators: z
      .object({
        // urlLocators can become optional if we add other locator types.
        urlLocators: z.array(CreateUrlLocator),
      })
      .optional(),
    citations: z.array(CreateMediaExcerptCitation).optional(),
    speakers: z.array(CreateMediaExcerptSpeaker).optional(),
  });
function refineCreateMediaExcerpt(
  val: CreateMediaExcerpt | CreateMediaExcerptInput,
  ctx: z.RefinementCtx
) {
  if (keys(val.localRep).length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `At least one of ${keys(
        MediaExcerpt.shape.localRep.shape
      )} is required.`,
    });
  }
  if (!val.locators && (!val.citations || val.citations.length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `At least one of locators or citations is required.`,
    });
  }
  if (val.locators && keys(val.locators).length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Locators must contain at least one of ${keys(
        MediaExcerpt.shape.locators.shape
      )} is required.`,
    });
  }
}
export const CreateMediaExcerpt = CreateMediaExcerptBase.superRefine(
  refineCreateMediaExcerpt
);
export type CreateMediaExcerpt = z.infer<typeof CreateMediaExcerpt>;

export const CreateMediaExcerptInput = CreateMediaExcerptBase.extend({
  citations: z.array(CreateMediaExcerptCitationInput).optional(),
}).superRefine(refineCreateMediaExcerpt);
export type CreateMediaExcerptInput = z.output<typeof CreateMediaExcerptInput>;

export const UpdateMediaExcerpt = CreateMediaExcerpt;
export type UpdateMediaExcerpt = z.infer<typeof UpdateMediaExcerpt>;

export const UpdateMediaExcerptInput = UpdateMediaExcerpt;
export type UpdateMediaExcerptInput = z.output<typeof UpdateMediaExcerptInput>;

export const CreateUrlLocatorsInput = z.object({
  mediaExcerptId: z.string(),
  urlLocators: z.array(CreateUrlLocator),
});
export type CreateUrlLocatorsInput = z.output<typeof CreateUrlLocatorsInput>;

export type CreateJustificationInput = Entity & {
  // A justification can target anything that can be a root target.
  // Additionally, it can target other justifications to counter them.
  target: {
    type: JustificationTargetType;
    proposition: EntityOrRef<CreatePropositionInput>;
    statement: EntityOrRef<CreateStatementInput>;
    // Since this reference is circular, it must be optional to prevent infinite recursion.
    justification?: EntityOrRef<CreateJustificationInput>;
  };
  polarity: JustificationPolarity;
  basis: {
    type: JustificationBasisType;
    propositionCompound: EntityOrRef<CreatePropositionCompoundInput>;
    mediaExcerpt: CreateMediaExcerptInput | EntityRef<MediaExcerpt>;
    /** @deprecated */
    sourceExcerpt: EntityOrRef<CreateSourceExcerptInput>;
    /** @deprecated */
    writQuote: EntityOrRef<CreateWritQuoteInput>;
    /** @deprecated Don't validate JBCs since they are deprecated. */
    justificationBasisCompound?: Entity;
  };
  rootPolarity: JustificationRootPolarity;
  rootTargetType: JustificationRootTargetType;
  rootTarget:
    | EntityOrRef<CreatePropositionInput>
    | EntityOrRef<CreateStatementInput>;
};
const createJustificationBaseShape = {
  ...omit(justificationBaseShape, ["created"]),
  basis: z.object({
    type: z.enum([
      "PROPOSITION_COMPOUND",
      "MEDIA_EXCERPT",
      "SOURCE_EXCERPT",
      "WRIT_QUOTE",
    ] as [JustificationBasisType, ...JustificationBasisType[]]),
    propositionCompound: z.union([
      CreatePropositionCompound,
      PropositionCompoundRef,
    ]),
    mediaExcerpt: MediaExcerptRef.optional(),
    sourceExcerpt: z.union([CreateSourceExcerpt, SourceExcerptRef]),
    writQuote: z.union([CreateWritQuote, WritQuoteRef]),
    justificationBasisCompound: Entity.optional(),
  }),
};
const createJustificationInputBaseShape = {
  ...omit(createJustificationBaseShape, ["basis"]),
  basis: z.object({
    type: z.enum([
      "PROPOSITION_COMPOUND",
      "MEDIA_EXCERPT",
      "SOURCE_EXCERPT",
      "WRIT_QUOTE",
    ] as [JustificationBasisType, ...JustificationBasisType[]]),
    propositionCompound: z.union([
      CreatePropositionCompoundInput,
      PropositionCompoundRef,
    ]),
    mediaExcerpt: MediaExcerptRef,
    sourceExcerpt: z.union([CreateSourceExcerptInput, SourceExcerptRef]),
    writQuote: z.union([CreateWritQuoteInput, WritQuoteRef]),
    justificationBasisCompound: Entity.optional(),
  }),
};
/** A view model for creating a new justification.
 *
 * Supports edits to alternative bases at the same time (whereas a materialized Justification can
 * have just one basis type.) This used to be called a NewJustification.
 */
export const CreateJustificationInput: z.ZodType<CreateJustificationInput> =
  z.lazy(() =>
    Entity.extend({
      ...createJustificationInputBaseShape,
      target: z.object({
        type: z.enum(["PROPOSITION", "STATEMENT", "JUSTIFICATION"] as [
          JustificationTargetType,
          ...JustificationTargetType[]
        ]),
        proposition: z.union([CreatePropositionInput, PropositionRef]),
        statement: z.union([CreateStatementInput, StatementRef]),
        justification: z
          .union([CreateJustificationInput, JustificationRef])
          // Create the justification input on-demand to avoid infinite recursion
          .optional(),
      }),
      // TODO(151) move rootTargetType onto rootTarget to make it an encapsulated discriminated union.
      // that way we gain type safety but don't need alternative definitions of CreateJustification like
      // for Justification above.
      rootTargetType: z.enum(["PROPOSITION", "STATEMENT"]),
      rootTarget: z.union([
        Proposition,
        PropositionRef,
        Statement,
        StatementRef,
      ]),
    })
  );
export type CreateJustificationInputBasis = CreateJustificationInput["basis"];
export type CreateJustificationInputBasisSourceExcerpt =
  CreateJustificationInput["basis"]["sourceExcerpt"];
export type CreateJustificationInputTarget = CreateJustificationInput["target"];
export type CreateJustificationInputRootTarget =
  CreateJustificationInput["rootTarget"];

export type CreateJustification = Simplify<
  Omit<
    CreateJustificationInput,
    "basis" | "target" | "rootTargetType" | "rootTarget" | "rootPolarity"
  > & {
    basis:
      | {
          type: "PROPOSITION_COMPOUND";
          entity: EntityOrRef<CreatePropositionCompound>;
        }
      | {
          type: "MEDIA_EXCERPT";
          entity: CreateMediaExcerpt | EntityRef<MediaExcerpt>;
        }
      | {
          type: "SOURCE_EXCERPT";
          entity: EntityOrRef<CreateSourceExcerpt>;
        }
      | {
          type: "WRIT_QUOTE";
          entity: EntityOrRef<CreateWritQuote>;
        };
    target:
      | {
          type: "PROPOSITION";
          entity: EntityOrRef<CreateProposition>;
        }
      | {
          type: "STATEMENT";
          entity: CreateStatement | PersistedEntity;
        }
      | {
          type: "JUSTIFICATION";
          entity: CreateJustification | PersistedEntity;
        };
  }
>;
export const CreateJustification: z.ZodType<CreateJustification> = z.lazy(() =>
  Entity.extend({
    ...omit(createJustificationBaseShape, ["rootPolarity"]),
    basis: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("PROPOSITION_COMPOUND"),
        entity: z.union([CreatePropositionCompound, PropositionCompoundRef]),
      }),
      z.object({
        type: z.literal("MEDIA_EXCERPT"),
        entity: z.union([CreateMediaExcerpt, MediaExcerptRef]),
      }),
      z.object({
        type: z.literal("SOURCE_EXCERPT"),
        entity: z.union([CreateSourceExcerpt, SourceExcerptRef]),
      }),
      z.object({
        type: z.literal("WRIT_QUOTE"),
        entity: z.union([CreateWritQuote, WritQuoteRef]),
      }),
    ]),
    target: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("PROPOSITION"),
        entity: z.union([CreateProposition, PropositionRef]),
      }),
      z.object({
        type: z.literal("STATEMENT"),
        entity: z.union([CreateStatement, StatementRef]),
      }),
      z.object({
        type: z.literal("JUSTIFICATION"),
        entity: z.union([CreateJustification, JustificationRef]),
      }),
    ]),
  })
);
export type CreateJustificationBasis = CreateJustification["basis"];
export type CreateJustificationTarget = CreateJustification["target"];

export const CreateCounterJustificationInput = Entity.extend({
  ...createJustificationInputBaseShape,
  polarity: z.literal("NEGATIVE"),
  basis: z.object({
    type: z.literal("PROPOSITION_COMPOUND"),
    propositionCompound: z.union([
      CreatePropositionCompoundInput,
      PropositionCompoundRef,
    ]),
  }),
  target: z.object({
    type: z.literal("JUSTIFICATION"),
    justification: z.union([CreateJustificationInput, JustificationRef]),
  }),
});
export type CreateCounterJustificationInput = z.infer<
  typeof CreateCounterJustificationInput
>;
export type CreateCounterJustificationInputBasis =
  CreateCounterJustificationInput["basis"];
export type CreateCounterJustificationInputTarget =
  CreateCounterJustificationInput["target"];
export type CreateCounterJustificationInputTargetJustification =
  CreateCounterJustificationInput["target"]["justification"];

export const CreateCounterJustification =
  CreateCounterJustificationInput.extend({
    basis: z.object({
      type: z.literal("PROPOSITION_COMPOUND"),
      entity: z.union([CreatePropositionCompound, PropositionCompoundRef]),
    }),
    target: z.object({
      type: z.literal("JUSTIFICATION"),
      entity: z.union([CreateJustification, JustificationRef]),
    }),
  });
export type CreateCounterJustification = z.infer<
  typeof CreateCounterJustification
>;
export type CreateCounterJustificationTarget =
  CreateCounterJustification["target"];
export type CreateCounterJustificationBasis =
  CreateCounterJustification["basis"];

const justificationVotePolarities = z.enum(["POSITIVE", "NEGATIVE"]);
export const JustificationVote = Entity.extend({
  polarity: justificationVotePolarities,
  // TODO(256): replace justificationId with justification.id.
  justificationId: z.string(),
  justification: JustificationRef,
});
export type JustificationVote = z.infer<typeof JustificationVote>;
export type JustificationVotePolarity = JustificationVote["polarity"];
export const JustificationVotePolarities = justificationVotePolarities.Enum;

export const CreateJustificationVote = JustificationVote.omit({
  justification: true,
});
export type CreateJustificationVote = z.infer<typeof CreateJustificationVote>;

export const DeleteJustificationVote = CreateJustificationVote;
export type DeleteJustificationVote = z.infer<typeof DeleteJustificationVote>;

const TaggableEntityType = z.enum(["PROPOSITION", "STATEMENT"]);
export type TaggableEntityType = z.infer<typeof TaggableEntityType>;

// TODO(359) make this a discriminated union over all target entity types?
export const TagVote = Entity.extend({
  target: Entity,
  targetType: TaggableEntityType,
  polarity: tagVotePolarities,
  tag: Tag,
});
export type TagVote = z.infer<typeof TagVote>;
export const TagVotePolarities = tagVotePolarities.Enum;

export const CreateTagVote = TagVote.extend({
  tag: z.union([TagRef, CreateTag]),
});
export type CreateTagVote = z.infer<typeof CreateTagVote>;

const EntityType = z.enum([
  "APPEARANCE",
  "JUSTIFICATION",
  "JUSTIFICATION_VOTE",
  "MEDIA_EXCERPT",
  "PASSWORD_HASH",
  "PASSWORD_RESET_REQUEST",
  "PERSORG",
  "PROPOSITION",
  "PROPOSITION_TAG_VOTE",
  "REGISTRATION_REQUEST",
  "SOURCE",
  "STATEMENT",
  "TAG_VOTE",
  "URL",
  "URL_LOCATOR",
  "USER",
  "WRIT",
  "WRIT_QUOTE",
]);
export type EntityType = z.infer<typeof EntityType>;
export const EntityTypes = EntityType.Enum;

const ContentReportType = z.enum([
  "HARASSMENT",
  "THREATENING_VIOLENCE",
  "HATEFUL",
  "OBSCENE",
  "SEXUALIZATION_OF_MINORS",
  "SHARING_PRIVATE_PERSONAL_INFORMATION",
  "PORNOGRAPHY",
  "ILLEGAL_ACTIVITY",
  "IMPERSONATION",
  "COPYRIGHT_VIOLATION",
  "TRADEMARK_VIOLATION",
  "SPAM",
  "OTHER",
]);
export type ContentReportType = z.infer<typeof ContentReportType>;
export const ContentReportTypes = ContentReportType.Enum;

export const ContentReport = Entity.extend({
  entityType: EntityType,
  entityId: z.string(),
  // When creating or reading a content report, we only need to keep the unique types.
  types: z.array(ContentReportType),
  description: z.string(),
  url: urlString(),
  reporterUserId: z.string(),
  created: momentObject,
});
export type ContentReport = z.infer<typeof ContentReport>;

export const CreateContentReport = ContentReport.omit({
  reporterUserId: true,
  created: true,
});
export type CreateContentReport = z.input<typeof CreateContentReport>;

export const CreateContentReportInput = ContentReport.extend({
  // When creating a content report, we maintain a map of whether any particular type is selected.
  checkedByType: z.map(ContentReportType, z.boolean()),
});
export type CreateContentReportInput = z.infer<typeof CreateContentReportInput>;

/** Additional properties that we collect upon user creation, but that we don't expose later. */
export const CreateUser = User.omit({
  created: true,
  externalIds: true,
}).extend({
  doesAcceptTerms: z.literal(true, {
    required_error: "Must accept the terms.",
    invalid_type_error: "Must accept the terms.",
  }),
  is13YearsOrOlder: z.literal(true, {
    required_error: "Must be 13 years or older.",
    invalid_type_error: "Must be 13 years or older.",
  }),
  hasMajorityConsent: z.literal(true, {
    required_error: "Must have adult consent.",
    invalid_type_error: "Must have adult consent.",
  }),
  isNotGdpr: z.literal(true, {
    required_error: "Must not be subject to the GDPR.",
    invalid_type_error: "Must not be subject to the GDPR.",
  }),
});
export type CreateUser = z.infer<typeof CreateUser>;

export const AccountSettings = Entity.extend({
  paidContributionsDisclosure: z.string().max(4096),
});
export type AccountSettings = z.infer<typeof AccountSettings>;
export const CreateAccountSettings = AccountSettings;
export type CreateAccountSettings = AccountSettings;
export const UpdateAccountSettings = AccountSettings;
export type UpdateAccountSettings = AccountSettings;
export type UpdateAccountSettingsInput = AccountSettings;

/**
 * A model for creating a Proposition potentially with Speakers and/or Justifications.
 */
export const CreateJustifiedSentenceInput = z.object({
  proposition: CreatePropositionInput,
  speakers: z.array(CreatePersorgInput),
  doCreateJustification: z.boolean(),
  justification: CreateJustificationInput,
});
export type CreateJustifiedSentenceInput = z.infer<
  typeof CreateJustifiedSentenceInput
>;

export const CreateJustifiedSentence = z.object({
  proposition: CreateProposition,
  speakers: z.array(CreatePersorg),
  doCreateJustification: z.boolean(),
  justification: CreateJustification,
});
export type CreateJustifiedSentence = z.infer<typeof CreateJustifiedSentence>;

export const RegistrationRequest = Entity.extend({
  email: User.shape.email,
  registrationCode: z.string(),
  isConsumed: z.boolean(),
  expires: momentObject,
  created: momentObject,
});
export type RegistrationRequest = z.infer<typeof RegistrationRequest>;

export const CreateRegistrationRequest = RegistrationRequest.pick({
  email: true,
});
export type CreateRegistrationRequest = z.infer<
  typeof CreateRegistrationRequest
>;
export const CreateRegistrationRequestInput = CreateRegistrationRequest;
export type CreateRegistrationRequestInput = CreateRegistrationRequest;

export const Password = z.string().min(6).max(64);
export type Password = z.infer<typeof Password>;

export const RegistrationConfirmation = z.object({
  registrationCode: z.string().min(1).max(256),
  phoneNumber: User.shape.phoneNumber,
  username: User.shape.username,
  shortName: User.shape.shortName,
  longName: User.shape.longName,
  password: Password,
  doesAcceptTerms: CreateUser.shape.doesAcceptTerms,
  is13YearsOrOlder: CreateUser.shape.is13YearsOrOlder,
  hasMajorityConsent: CreateUser.shape.hasMajorityConsent,
  isNotGdpr: CreateUser.shape.isNotGdpr,
});
export type RegistrationConfirmation = z.infer<typeof RegistrationConfirmation>;
export const CreateRegistrationConfirmation = RegistrationConfirmation;
export type CreateRegistrationConfirmation = RegistrationConfirmation;
export const CreateRegistrationConfirmationInput = RegistrationConfirmation;
export type CreateRegistrationConfirmationInput = RegistrationConfirmation;

export const PasswordResetRequest = Entity.extend({
  userId: z.string(),
  email: User.shape.email,
  passwordResetCode: z.string(),
  expires: momentObject,
  isConsumed: z.boolean(),
  created: momentObject,
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequest>;

export const Credentials = z.object({
  email: User.shape.email,
  password: Password,
});
export type Credentials = z.infer<typeof Credentials>;
