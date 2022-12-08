/**
 * Zod validation schemas.
 *
 * Only things that we need to validate should go here. That must be things that are input to the
 * system, like form models and API request bodies. Types that represent database output, API
 * responses, and view models that we derive on the client do not require validation.
 */

import { z } from "zod";
import { iso8601Datetime, url } from "./zodRefinements";
import { EntityName, EntityOrRef } from "./zodSchemaTypes";

/** A perstisent conceptual entity */
export const Entity = z.object({
  // Entities have an ID after they have been persisted.
  id: z.string().optional(),
});
export type Entity = z.infer<typeof Entity>;

export const Proposition = Entity.extend({
  text: z.string().min(1),
}).strict();
export type Proposition = z.infer<typeof Proposition>;

export const Persorg = Entity.extend({
  isOrganization: z.boolean(),
  name: z.string(),
  knownFor: z.string(),
  websiteUrl: z.string().url().optional(),
  twitterUrl: z
    .string()
    .superRefine(url({ domain: /twitter.com$/ }))
    .optional(),
  wikipediaUrl: z
    .string()
    .superRefine(url({ domain: /wikipedia.org$/ }))
    .optional(),
}).strict();
export type Persorg = z.infer<typeof Persorg>;

export const CreatePersorg = Persorg;
export type CreatePersorg = z.infer<typeof CreatePersorg>;

export const CreatePersorgInput = Persorg;
export type CreatePersorgInput = z.infer<typeof CreatePersorgInput>;

export type Statement = Entity & {
  speaker: Persorg;
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
export const Statement: z.ZodType<Statement> = z.lazy(() =>
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
export type Sentence = Statement["sentence"];
export type SentenceType = Statement["sentenceType"];
export const SentenceTypes = sentenceTypes.Enum;

export const CreateStatementInput = Statement;
export type CreateStatementInput = Statement;
export const CreateStatement = Statement;
export type CreateStatement = Statement;
// Statement has no Edit models; users can edit the proposition/statement or the speaker.

export const Writ = Entity.extend({
  title: z.string().min(1).max(512),
});
export type Writ = z.infer<typeof Writ>;

const urlTargetAnchorTypes = z.enum(["TEXT_QUOTE"]);
// later this can be a discriminatedUnion on type.
export const UrlTargetAnchor = z.object({
  type: z.literal(urlTargetAnchorTypes.Enum.TEXT_QUOTE),
  exactText: z.string(),
  prefixText: z.string(),
  suffixText: z.string(),
  startOffset: z.string(),
  endOffset: z.string(),
});
export type UrlTargetAnchor = z.infer<typeof UrlTargetAnchor>;
export type UrlTargetAnchorType = UrlTargetAnchor["type"];
export const UrlTargetAnchorTypes = urlTargetAnchorTypes.Enum;

export const UrlTarget = Entity.extend({
  anchors: z.array(UrlTargetAnchor),
});

export const Url = Entity.extend({
  url: z.string().url(),
  target: UrlTarget.optional(),
});
export type Url = z.infer<typeof Url>;

/** A SourceExcerpt of a quote from a written Source. */
export const WritQuote = Entity.extend({
  quoteText: z.string(),
  writ: Writ,
  urls: z.array(Url),
});
export type WritQuote = z.infer<typeof WritQuote>;

export const Pic = Entity.extend({});
export type Pic = z.infer<typeof Pic>;
export const PicRegion = Entity.extend({
  pic: Pic,
});
export type PicRegion = z.infer<typeof PicRegion>;

export const Vid = Entity.extend({});
export type Vid = z.infer<typeof Vid>;
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

/* One or more propositions intended to be considered conjunctively */
export const PropositionCompound = Entity.extend({
  atoms: z
    .array(
      Entity.extend({
        entity: Proposition,
      })
    )
    .min(1),
});
export type PropositionCompound = z.infer<typeof PropositionCompound>;
export type PropositionCompoundAtom = PropositionCompound["atoms"][number];

export type CreatePropositionCompoundAtom = PropositionCompoundAtom;
export type CreatePropositionCompoundAtomInput = PropositionCompoundAtom;

const JustificationPolarity = z.enum(["POSITIVE", "NEGATIVE"]);
export type JustificationPolarity = z.infer<typeof JustificationPolarity>;
export const JustificationPolarities = JustificationPolarity.Enum;

const JustificationRootPolarity = z.enum(["POSITIVE", "NEGATIVE"]);
export type JustificationRootPolarity = z.infer<
  typeof JustificationRootPolarity
>;
export const JustificationRootPolarities = JustificationRootPolarity.Enum;

// Explicit recursive typing for Justification
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
      }
    /**
     * A mixture of Propositions and WritQuotes.
     *
     * @deprecated We decided not to mix 'claims' (Propositions) and 'evidence' (SourceExcerpts).
     * Instead, a justificaiton must be all Propositions (a PropositionCompound) or a single SourceExcerpt.
     */
    | {
        type: "JUSTIFICATION_BASIS_COMPOUND";
        entity: Entity;
      };
  rootPolarity: JustificationRootPolarity;
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
const justificationBasisTypes = z.enum([
  "PROPOSITION_COMPOUND",
  "SOURCE_EXCERPT",
  // deprecated
  "WRIT_QUOTE",
  // deprecated
  "JUSTIFICATION_BASIS_COMPOUND",
]);
export const JustificationBasisTypes = justificationBasisTypes.Enum;
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
};
const justificationRootTargetTypes = z.enum(["PROPOSITION", "STATEMENT"]);
export const JustificationRootTargetTypes = justificationRootTargetTypes.Enum;
const justificationTargetTypes = z.enum([
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
          type: z.literal(justificationTargetTypes.Enum.PROPOSITION),
          entity: Proposition,
        }),
        z.object({
          type: z.literal(justificationTargetTypes.Enum.STATEMENT),
          entity: Statement,
        }),
        z.object({
          type: z.literal(justificationTargetTypes.Enum.JUSTIFICATION),
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
          type: z.literal(justificationTargetTypes.Enum.PROPOSITION),
          entity: Proposition,
        }),
        z.object({
          type: z.literal(justificationTargetTypes.Enum.STATEMENT),
          entity: Statement,
        }),
        z.object({
          type: z.literal(justificationTargetTypes.Enum.JUSTIFICATION),
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
export const JustificationTargetTypes = justificationTargetTypes.Enum;

/*
  Replace Persisted with Entity Ref. For places where we were depending on Persisted's optional
  fields, Use a specific view model instead of a bunch of optional fields.
  Materialized -> ApiModels? DbModels? Make a specific type for each use-case rather than requiring
  all fields. I would call them ViewModels, except that the view may modify them, such as creating
  circular references or indexing fields.

  One thing that would be handy would be a type helper that recursively replaces any related
  entities with a union of the Entity or an EntityRef. We could use this to create base input models... actually
  even this is not necessary. Each form should know what type of thing it's creating.
 */

export const PropositionRef =
  Entity.required().brand<EntityName<Proposition>>();
export type PropositionRef = z.infer<typeof PropositionRef>;

export const StatementRef = Entity.required().brand<EntityName<Statement>>();
export type StatementRef = z.infer<typeof StatementRef>;

export const JustificationRef =
  Entity.required().brand<EntityName<Justification>>();
export type JustificationRef = z.infer<typeof JustificationRef>;

export const PropositionCompoundRef =
  Entity.required().brand<"PropositionCompound">();
export type PropositionCompoundRef = z.infer<typeof PropositionCompoundRef>;

export const SourceExcerptRef =
  Entity.required().brand<EntityName<SourceExcerpt>>();
export type SourceExcerptRef = z.infer<typeof SourceExcerptRef>;

export const WritQuoteRef = Entity.required().brand<EntityName<WritQuote>>();
export type WritQuoteRef = z.infer<typeof WritQuoteRef>;

export const TagRef = Entity.required().brand<EntityName<Tag>>();
export type TagRef = z.infer<typeof TagRef>;

/*
 * Entities lacking alternatives don't require special Create/Edit models
 */
export const CreatePropositionInput = Proposition;
export type CreatePropositionInput = Proposition;
export const CreateProposition = Proposition;
export type CreateProposition = Proposition;

export const EditPropositionInput = Proposition;
export type EditPropositionInput = Proposition;
export const EditProposition = Proposition;
export type EditProposition = Proposition;

export const CreatePropositionCompoundInput = PropositionCompound;
export type CreatePropositionCompoundInput = PropositionCompound;
export const CreatePropositionCompound = PropositionCompound;
export type CreatePropositionCompound = PropositionCompound;

export const EditPropositionCompoundInput = PropositionCompound;
export type EditPropositionCompoundInput = PropositionCompound;
export const EditPropositionCompound = PropositionCompound;
export type EditPropositionCompound = PropositionCompound;

export const CreateWritQuoteInput = WritQuote;
export type CreateWritQuoteInput = WritQuote;
export const CreateWritQuote = WritQuote;
export type CreateWritQuote = WritQuote;

export const EditWritQuoteInput = WritQuote;
export type EditWritQuoteInput = WritQuote;
export const EditWritQuote = WritQuote;
export type EditWritQuote = WritQuote;

export const CreateVidSegmentInput = VidSegment;
export type CreateVidSegmentInput = VidSegment;
export const CreateVidSegment = VidSegment;
export type CreateVidSegment = VidSegment;

export const EditVidSegmentInput = VidSegment;
export type EditVidSegmentInput = VidSegment;
export const EditVidSegment = VidSegment;
export type EditVidSegment = VidSegment;

export const CreatePicRegionInput = PicRegion;
export type CreatePicRegionInput = PicRegion;
export const CreatePicRegion = PicRegion;
export type CreatePicRegion = PicRegion;

export const EditPicRegionInput = PicRegion;
export type EditPicRegionInput = PicRegion;
export const EditPicRegion = PicRegion;
export type EditPicRegion = PicRegion;

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
    writQuote: EntityOrRef<WritQuote>;
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
  ...justificationBaseShape,
  basis: z.object({
    type: z.enum(["PROPOSITION_COMPOUND", "SOURCE_EXCERPT", "WRIT_QUOTE"] as [
      JustificationBasisType,
      ...JustificationBasisType[]
    ]),
    propositionCompound: z.union([PropositionCompound, PropositionCompoundRef]),
    sourceExcerpt: z.union([CreateSourceExcerptInput, SourceExcerptRef]),
    writQuote: z.union([WritQuote, WritQuoteRef]),
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
      ...createJustificationBaseShape,
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

export type CreateJustification = Omit<
  CreateJustificationInput,
  "basis" | "target" | "rootTargetType" | "rootTarget"
> & {
  basis:
    | {
        type: "PROPOSITION_COMPOUND";
        entity: EntityOrRef<CreatePropositionCompound>;
      }
    | {
        type: "SOURCE_EXCERPT";
        entity: EntityOrRef<SourceExcerpt>;
      }
    | {
        type: "WRIT_QUOTE";
        entity: EntityOrRef<WritQuote>;
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
};
export const CreateJustification: z.ZodType<CreateJustification> = z.lazy(() =>
  Entity.extend({
    ...createJustificationBaseShape,
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
  ...createJustificationBaseShape,
  polarity: z.literal("NEGATIVE"),
  basis: z.object({
    type: z.literal("PROPOSITION_COMPOUND"),
    propositionCompound: z.union([PropositionCompound, PropositionCompoundRef]),
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
      entity: z.union([PropositionCompound, PropositionCompoundRef]),
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
export const JustificationVote = z.object({
  polarity: justificationVotePolarities,
  justification: JustificationRef,
});
export type JustificationVote = z.infer<typeof JustificationVote>;
export type JustificationVotePolarity = JustificationVote["polarity"];
export const JustificationVotePolarities = justificationVotePolarities.Enum;

export const Tag = Entity.extend({
  name: z.string(),
});
export type Tag = z.infer<typeof Tag>;

const TaggableEntityType = z.enum(["PROPOSITION", "STATEMENT"]);
export type TaggableEntityType = z.infer<typeof TaggableEntityType>;

const tagVotePolarities = z.enum(["POSITIVE", "NEGATIVE"]);
// TODO make this a discriminated union over all target entity types?
export const TagVote = Entity.extend({
  target: Entity,
  targetType: TaggableEntityType,
  polarity: tagVotePolarities,
  tag: z.union([Tag, TagRef]),
});
export type TagVote = z.infer<typeof TagVote>;
export type TagVotePolarity = TagVote["polarity"];
export const TagVotePolarities = tagVotePolarities.Enum;

// TODO: replace with TagVote
export const PropositionTagVote = Entity.extend({
  proposition: z.union([Proposition, PropositionRef]),
  polarity: tagVotePolarities,
  tag: z.union([Tag, TagRef]),
});
export type PropositionTagVote = z.infer<typeof PropositionTagVote>;
export type PropositionTagVotePolarity = PropositionTagVote["polarity"];
export const PropositionTagVotePolarities = tagVotePolarities.Enum;

export const CreatePropositionTagVote = PropositionTagVote;
export type CreatePropositionTagVote = PropositionTagVote;

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
});
export type ContentReport = z.infer<typeof ContentReport>;

export const CreateContentReportInput = ContentReport.extend({
  // When creating a content report, we maintain a map of whether any particular type is selected.
  checkedByType: z.map(ContentReportType, z.boolean()),
});
export type CreateContentReportInput = z.infer<typeof CreateContentReportInput>;

/** A user of the system */
export const User = Entity.extend({
  email: z.string(),
  username: z.string(),
  longName: z.string(),
  shortName: z.string(),
  created: z.string().refine(...iso8601Datetime),
  isActive: z.boolean(),
  externalIds: z.object({
    googleAnalyticsId: z.string(),
    heapAnalyticsId: z.string(),
    mixpanelId: z.string(),
    sentryId: z.string(),
    smallchatId: z.string(),
  }),
});
export type User = z.infer<typeof User>;

/** Additional properties that we collect upon user creation, but that we don't expose later. */
export const UserSubmissionModel = User.extend({
  acceptedTerms: z.boolean(),
  affirmedMajorityConsent: z.boolean(),
  affirmed13YearsOrOlder: z.boolean(),
  affirmedNotGdpr: z.boolean(),
});
export type UserSubmissionModel = z.infer<typeof UserSubmissionModel>;

export const AccountSettings = Entity.extend({
  paidContributionsDisclosure: z.string(),
});
export type AccountSettings = z.infer<typeof AccountSettings>;
export type EditAccountSettings = AccountSettings;
export type EditAccountSettingsInput = AccountSettings;

/**
 * A CreationModel for creating a Proposition potentially with Speakers and/or Justifications.
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
  justification: CreateJustificationInput,
});
export type CreateJustifiedSentence = z.infer<typeof CreateJustifiedSentence>;

export const RegistrationRequest = z.object({
  email: z.string().email(),
});
export type RegistrationRequest = z.infer<typeof RegistrationRequest>;

export type CreateRegistrationRequest = RegistrationRequest;
export type CreateRegistrationRequestInput = RegistrationRequest;

export const RegistrationConfirmation = z.object({
  registrationCode: z.string().min(1),
  username: z.string().min(3),
  shortName: z.string().min(2),
  longName: z.string().min(3),
  password: z.string().min(6),
  doesAcceptTerms: z.boolean(),
  is13YearsOrOlder: z.boolean(),
  hasMajorityConsent: z.boolean(),
  isNotGdpr: z.boolean(),
});
export type RegistrationConfirmation = z.infer<typeof RegistrationConfirmation>;
export type CreateRegistrationConfirmation = RegistrationConfirmation;
export type CreateRegistrationConfirmationInput = RegistrationConfirmation;
