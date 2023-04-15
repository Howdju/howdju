/**
 * Zod validation schemas.
 *
 * Only things that we need to validate should go here. We must validate input to the
 * system, including form models and API request bodies. Values that represent database output, API
 * responses, and view models that we derive on the client do not require validation, although we
 * may benefit from defining them using Zod schemas.
 */

import { omit } from "lodash";
import { Moment } from "moment";
import { Simplify } from "type-fest";
import { z } from "zod";
import { momentObject, urlString } from "./zodRefinements";
import { EntityName, EntityOrRef } from "./zodSchemaTypes";

/** A perstisent conceptual entity */
export const Entity = z.object({
  // Entities have an ID after they have been persisted.
  id: z.string().optional(),
});
export type Entity = z.infer<typeof Entity>;

const PersistedEntity = Entity.required();
export type PersistedEntity = z.infer<typeof PersistedEntity>;

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
}).strict();
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
  websiteUrl: z.string().url().optional(),
  /** The persorg's Twitter. */
  twitterUrl: urlString({ domain: /twitter.com$/ }).optional(),
  /** The persorg's Wikipedia URL. */
  wikipediaUrl: urlString({ domain: /wikipedia.org$/ }).optional(),
}).strict();
export type Persorg = z.infer<typeof Persorg>;

export const CreatePersorg = Persorg;
export type CreatePersorg = z.infer<typeof CreatePersorg>;

export const CreatePersorgInput = Persorg;
export type CreatePersorgInput = z.infer<typeof CreatePersorgInput>;

export const UpdatePersorg = Persorg;
export type UpdatePersorg = z.infer<typeof UpdatePersorg>;

export const UpdatePersorgInput = Persorg;
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
    }).strict(),
    Entity.extend({
      sentenceType: z.literal(sentenceTypes.Enum.STATEMENT),
      sentence: Statement,
      ...baseStatement,
    }).strict(),
  ])
);
export type Sentence = Statement["sentence"];
export type SentenceType = Statement["sentenceType"];
export const SentenceTypes = sentenceTypes.Enum;

export type CreateStatementInput = Entity & {
  speaker: Persorg;
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
      }).strict(),
      Entity.extend({
        sentenceType: z.literal(sentenceTypes.Enum.STATEMENT),
        sentence: CreateStatementInput,
        speaker: Persorg,
      }).strict(),
    ])
);

export type CreateStatement = Entity & {
  speaker: Persorg;
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
      sentence: Proposition,
      speaker: Persorg,
    }).strict(),
    Entity.extend({
      sentenceType: z.literal(sentenceTypes.Enum.STATEMENT),
      sentence: Statement,
      speaker: Persorg,
    }).strict(),
  ])
);
// Statement has no Update models; users can edit the proposition/statement or the speaker.

/** A textual media. */
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

const urlTargetAnchorTypes = z.enum(["TEXT_QUOTE"]);
/**
 * A reference to a portion of a URL document.
 */
export const UrlTargetAnchor = z.object({
  // later this can be a discriminatedUnion on type.
  type: z.literal(urlTargetAnchorTypes.Enum.TEXT_QUOTE),
  exactText: z.string(),
  prefixText: z.string(),
  suffixText: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
});
export type UrlTargetAnchor = z.infer<typeof UrlTargetAnchor>;
export type UrlTargetAnchorType = UrlTargetAnchor["type"];
export const UrlTargetAnchorTypes = urlTargetAnchorTypes.Enum;

export const UrlTarget = Entity.extend({
  anchors: z.array(UrlTargetAnchor),
});

export const Url = Entity.extend({
  url: z.string().url(),
  // TODO(38) I don't think target should be part of URL. Targets should be related to URLs.
  target: UrlTarget.optional(),
});
export type Url = z.infer<typeof Url>;

export const CreateUrl = Url;
export type CreateUrl = z.infer<typeof CreateUrl>;
export const CreateUrlInput = CreateUrl;
export type CreateUrlInput = z.infer<typeof CreateUrlInput>;

/** A SourceExcerpt of a quote from a written Source. */
export const WritQuote = Entity.extend({
  quoteText: z.string(),
  writ: Writ,
  urls: z.array(Url),
  created: momentObject,
});
export type WritQuote = z.infer<typeof WritQuote>;

/** A fixed visual media. */
export const Pic = Entity.extend({});
export type Pic = z.infer<typeof Pic>;
/** A reference to a part of a Pic. */
export const PicRegion = Entity.extend({
  pic: Pic,
});
export type PicRegion = z.infer<typeof PicRegion>;

/** A video media. */
export const Vid = Entity.extend({});
export type Vid = z.infer<typeof Vid>;
/** A reference to a part of a Vid. */
export const VidSegment = Entity.extend({
  vid: Vid,
});
export type VidSegment = z.infer<typeof VidSegment>;

const sourceExcerptTypes = z.enum(["WRIT_QUOTE", "PIC_REGION", "VID_SEGMENT"]);
/** An excerpt of some fixed media. */
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
export type SourceExcerpt = z.infer<typeof SourceExcerpt>;
export type SourceExcerptType = SourceExcerpt["type"];
export const SourceExcerptTypes = sourceExcerptTypes.Enum;

export const PropositionCompoundAtom = z.object({
  /** A reference to this atom's parent compound. */
  compoundId: z.string(),
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
        type: "SOURCE_EXCERPT";
        entity: SourceExcerpt;
      }
    /**
     * A quote from a written source
     *
     * @deprecated Use SOURCE_EXCERPT's WRIT_QUOTE type instead.
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
  "SOURCE_EXCERPT",
  // deprecated
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

/*
 * Entities lacking alternatives don't require special Create/Update models
 */

export const CreateWritQuoteInput = Entity.extend({
  quoteText: z.string(),
  writ: CreateWritInput,
  urls: z.array(CreateUrlInput),
});
export type CreateWritQuoteInput = z.infer<typeof CreateWritQuoteInput>;
export const CreateWritQuote = CreateWritQuoteInput;
export type CreateWritQuote = z.infer<typeof CreateWritQuote>;

export const UpdateWritQuoteInput = WritQuote;
export type UpdateWritQuoteInput = z.infer<typeof UpdateWritQuoteInput>;
export const UpdateWritQuote = WritQuote.merge(PersistedEntity);
export type UpdateWritQuote = z.infer<typeof UpdateWritQuote>;

export const CreateVidSegmentInput = VidSegment;
export type CreateVidSegmentInput = z.infer<typeof CreateVidSegmentInput>;
export const CreateVidSegment = VidSegment;
export type CreateVidSegment = z.infer<typeof CreateVidSegment>;

export const UpdateVidSegmentInput = VidSegment;
export type UpdateVidSegmentInput = z.infer<typeof UpdateVidSegmentInput>;
export const UpdateVidSegment = VidSegment;
export type UpdateVidSegment = z.infer<typeof UpdateVidSegment>;

export const CreatePicRegionInput = PicRegion;
export type CreatePicRegionInput = z.infer<typeof CreatePicRegionInput>;
export const CreatePicRegion = PicRegion;
export type CreatePicRegion = z.infer<typeof CreatePicRegion>;

export const UpdatePicRegionInput = PicRegion;
export type UpdatePicRegionInput = z.infer<typeof UpdatePicRegionInput>;
export const UpdatePicRegion = PicRegion;
export type UpdatePicRegion = z.infer<typeof UpdatePicRegion>;

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
export type CreateSourceExcerpt = z.infer<typeof CreateSourceExcerpt>;

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
    sourceExcerpt: EntityOrRef<CreateSourceExcerptInput>;
    // deprecated
    writQuote: EntityOrRef<CreateWritQuoteInput>;
    // Don't validate JBCs since they are deprecated.
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
    type: z.enum(["PROPOSITION_COMPOUND", "SOURCE_EXCERPT", "WRIT_QUOTE"] as [
      JustificationBasisType,
      ...JustificationBasisType[]
    ]),
    propositionCompound: z.union([
      CreatePropositionCompound,
      PropositionCompoundRef,
    ]),
    sourceExcerpt: z.union([CreateSourceExcerpt, SourceExcerptRef]),
    writQuote: z.union([CreateWritQuote, WritQuoteRef]),
    justificationBasisCompound: Entity.optional(),
  }),
};
const createJustificationInputBaseShape = {
  ...omit(createJustificationBaseShape, ["basis"]),
  basis: z.object({
    type: z.enum(["PROPOSITION_COMPOUND", "SOURCE_EXCERPT", "WRIT_QUOTE"] as [
      JustificationBasisType,
      ...JustificationBasisType[]
    ]),
    propositionCompound: z.union([
      CreatePropositionCompoundInput,
      PropositionCompoundRef,
    ]),
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
          entity: EntityOrRef<CreateStatement>;
        }
      | {
          type: "JUSTIFICATION";
          entity: EntityOrRef<CreateJustification>;
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
  "JUSTIFICATION",
  "JUSTIFICATION_VOTE",
  "PASSWORD_HASH",
  "PASSWORD_RESET_REQUEST",
  "PROPOSITION",
  "PROPOSITION_TAG_VOTE",
  "REGISTRATION_REQUEST",
  "STATEMENT",
  "TAG_VOTE",
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
  url: z.string().url(),
  reporterUserId: z.string(),
  created: momentObject,
});
export type ContentReport = z.infer<typeof ContentReport>;

export const CreateContentReport = ContentReport;
export type CreateContentReport = ContentReport;

export const CreateContentReportInput = ContentReport.extend({
  // When creating a content report, we maintain a map of whether any particular type is selected.
  checkedByType: z.map(ContentReportType, z.boolean()),
});
export type CreateContentReportInput = z.infer<typeof CreateContentReportInput>;

export const UserExternalIds = z.object({
  googleAnalyticsId: z.string(),
  heapAnalyticsId: z.string(),
  mixpanelId: z.string(),
  sentryId: z.string(),
});
export type UserExternalIds = z.infer<typeof UserExternalIds>;

/** A user of the system */
export const User = Entity.extend({
  email: z.string().email().max(128),
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

/** Additional properties that we collect upon user creation, but that we don't expose later. */
export const CreateUser = User.omit({
  created: true,
  externalIds: true,
}).extend({
  acceptedTerms: z.boolean().refine((v) => v, "Must accept the terms."),
  affirmed13YearsOrOlder: z
    .boolean()
    .refine((v) => v, "Must be 13 years or older."),
  affirmedMajorityConsent: z
    .boolean()
    .refine((v) => v, "Must have adult consent."),
  affirmedNotGdpr: z
    .boolean()
    .refine((v) => v, "Must not be subject to the GDPR."),
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

export const RegistrationConfirmation = z.object({
  registrationCode: z.string().min(1).max(256),
  phoneNumber: User.shape.phoneNumber,
  username: User.shape.username,
  shortName: User.shape.shortName,
  longName: User.shape.longName,
  password: z.string().min(6).max(64),
  doesAcceptTerms: CreateUser.shape.acceptedTerms,
  is13YearsOrOlder: CreateUser.shape.affirmed13YearsOrOlder,
  hasMajorityConsent: CreateUser.shape.affirmedMajorityConsent,
  isNotGdpr: CreateUser.shape.affirmedNotGdpr,
});
export type RegistrationConfirmation = z.infer<typeof RegistrationConfirmation>;
export const CreateRegistrationConfirmation = RegistrationConfirmation;
export type CreateRegistrationConfirmation = RegistrationConfirmation;
export const CreateRegistrationConfirmationInput = RegistrationConfirmation;
export type CreateRegistrationConfirmationInput = RegistrationConfirmation;

export const PasswordResetRequest = Entity.extend({
  userId: z.string(),
  email: z.string().email(),
  passwordResetCode: z.string(),
  expires: momentObject,
  isConsumed: z.boolean(),
  created: momentObject,
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequest>;

export const Password = z.string();
export type Password = z.infer<typeof Password>;

export const Credentials = z.object({
  email: z.string(),
  password: z.string(),
});
export type Credentials = z.infer<typeof Credentials>;
