import { schema } from "normalizr";

import {
  AccountSettings,
  ContextTrailItem,
  Justification,
  JustificationVote,
  MediaExcerpt,
  Persorg,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionTagVote,
  Source,
  SourceExcerptParaphrase,
  Statement,
  Tag,
  TagVote,
  User,
  VidSegment,
  Writ,
  WritQuote,
} from "howdju-common";

export const userSchema = new schema.Entity<User>("users");

export const tagSchema = new schema.Entity<Tag>("tags");
export const tagsSchema = new schema.Array(tagSchema);

export const propositionTagVoteSchema = new schema.Entity<PropositionTagVote>(
  "propositionTagVotes",
  {
    tag: tagSchema,
  }
);
const propositionTagVotesSchema = new schema.Array(propositionTagVoteSchema);

export const tagVoteSchema = new schema.Entity<TagVote>("tagVotes", {
  tag: tagSchema,
});
const tagVotesSchema = new schema.Array(tagVoteSchema);

export const propositionSchema = new schema.Entity<Proposition>(
  "propositions",
  {
    tags: tagsSchema,
    tagVotes: tagVotesSchema,
    recommendedTags: tagsSchema,
    propositionTagVotes: propositionTagVotesSchema,
    // justifications added below via justificationTargetSchema
  }
);
export const propositionsSchema = new schema.Array(propositionSchema);

export const persorgSchema = new schema.Entity<Persorg>("persorgs", {
  creator: userSchema,
});
export const persorgsSchema = new schema.Array(persorgSchema);

const sentenceSchema = new schema.Union(
  {},
  (_value, parent) => parent.sentenceType
);
export const statementSchema = new schema.Entity<Statement>("statements", {
  speaker: persorgSchema,
  sentence: sentenceSchema,
  // justifications added below via justificationTargetSchema
});
export const statementsSchema = new schema.Array(statementSchema);
sentenceSchema.define({
  PROPOSITION: propositionSchema,
  STATEMENT: statementSchema,
});

export const propositionCompoundSchema = new schema.Entity<PropositionCompound>(
  "propositionCompounds",
  {
    atoms: [
      {
        entity: propositionSchema,
      },
    ],
  }
);
export const writSchema = new schema.Entity<Writ>("writs");
export const writsSchema = new schema.Array(writSchema);

export const writQuoteSchema = new schema.Entity<WritQuote>("writQuotes", {
  writ: writSchema,
});
export const writQuotesSchema = new schema.Array(writQuoteSchema);

export const picRegionSchema = new schema.Entity<PicRegion>("picRegions", {});

export const vidSegmentsSchema = new schema.Entity<VidSegment>(
  "vidSegments",
  {}
);

export const justificationVoteSchema = new schema.Entity<JustificationVote>(
  "justificationVotes"
);

const sourceExcerptSchema = new schema.Union(
  {
    WRIT_QUOTE: writQuoteSchema,
    PIC_REGION: picRegionSchema,
    VID_SEGMENT: vidSegmentsSchema,
  },
  (_value, parent) => parent.type
);

/** @deprecated */
export const sourceExcerptParaphraseSchema =
  new schema.Entity<SourceExcerptParaphrase>("sourceExcerptParaphrases", {
    paraphrasingProposition: propositionSchema,
    sourceExcerpt: {
      entity: sourceExcerptSchema,
    },
  });

export const justificationTargetSchema = new schema.Union(
  {},
  (_value, parent) => parent.type
);
export const justificationBasisSchema = new schema.Union(
  {
    PROPOSITION_COMPOUND: propositionCompoundSchema,
    WRIT_QUOTE: writQuoteSchema,
  },
  (_value, parent) => parent.type
);

const justificationRootTargetSchema = new schema.Union(
  {
    STATEMENT: statementSchema,
    PROPOSITION: propositionSchema,
  },
  (_value, parent) => parent.rootTargetType
);

export const justificationSchema = new schema.Entity<Justification>(
  "justifications"
);
justificationSchema.define({
  rootTarget: justificationRootTargetSchema,
  target: {
    entity: justificationTargetSchema,
  },
  basis: {
    entity: justificationBasisSchema,
  },
  counterJustifications: new schema.Array(justificationSchema),
  vote: justificationVoteSchema,
});
export const justificationsSchema = new schema.Array(justificationSchema);
// The docs say that this definition is merged, but for me it appeared to overwrite what was there, at least for Unions
justificationTargetSchema.define({
  PROPOSITION: propositionSchema,
  STATEMENT: statementSchema,
  JUSTIFICATION: justificationSchema,
});

propositionSchema.define({
  justifications: justificationsSchema,
});
statementSchema.define({
  justifications: justificationsSchema,
});

export const mainSearchResultsSchema = {
  propositionTexts: propositionsSchema,
  writQuoteQuoteTexts: writQuotesSchema,
  writQuoteUrls: writQuotesSchema,
  writTitles: writsSchema,
  tags: tagsSchema,
  persorgsFromName: persorgsSchema,
};

export const accountSettingsSchema = new schema.Entity<AccountSettings>(
  "accountSettings"
);

const connectingEntitySchema = new schema.Union(
  {
    // TODO(20): add Appearances
    JUSTIFICATION: justificationSchema,
  },
  (_value, parent) => parent.connectingEntityType
);
export const contextTrailItemsSchema = new schema.Array(
  new schema.Entity<ContextTrailItem>("contextTrailItems", {
    connectingEntity: connectingEntitySchema,
  })
);

export const sourceSchema = new schema.Entity<Source>("sources");
export const sourcesSchema = new schema.Array(sourceSchema);
export const mediaExcerptSchema = new schema.Entity<MediaExcerpt>(
  "mediaExcerpts",
  {
    citations: new schema.Array({
      source: sourceSchema,
    }),
    speakers: new schema.Array(persorgSchema),
  }
);

/**
 * Converts a normalizr schema into a response payload.
 *
 * Replaces the schemas with their generic entity type.
 *
 * For example, given this schema:
 *
 * ```typescript
 * const someSchema: {
 *   proposition: schema.Entity<Proposition>;
 *   example: {
 *       justification: schema.Entity<Justification>;
 *   };
 * }
 * ```
 *
 * `ExtractSchemaEntity<typeof someSchema>` will be:
 *
 * ```typescript
 * type someSchemaEntities = {
 *   proposition: Proposition;
 *   example: {
 *       justification: Justification;
 *   };
 * }
 * ```
 *
 * TODO(266): do we need this?
 */
export type ExtractSchemaEntity<S> = S extends schema.Entity<infer E>
  ? E
  : {
      [Key in keyof S]: ExtractSchemaEntity<S[Key]>;
    };
