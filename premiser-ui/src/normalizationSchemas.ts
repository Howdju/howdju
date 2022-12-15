import { schema } from "normalizr";

import {
  AccountSettings,
  Justification,
  JustificationVote,
  Persorg,
  Pic,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionTagVote,
  SourceExcerptParaphrase,
  Statement,
  Tag,
  TagVote,
  User,
  Vid,
  VidSegment,
  Writ,
  WritQuote,
} from "howdju-common";

export const userSchema = new schema.Entity<User>("users");

export const tagSchema = new schema.Entity<Tag>("tags");
export const tagsSchema = [tagSchema];

export const propositionTagVoteSchema = new schema.Entity<PropositionTagVote>(
  "propositionTagVotes",
  {
    tag: tagSchema,
  }
);
const propositionTagVotesSchema = [propositionTagVoteSchema];

export const tagVoteSchema = new schema.Entity<TagVote>("tagVotes", {
  tag: tagSchema,
});
const tagVotesSchema = [tagVoteSchema];

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
export const propositionsSchema = [propositionSchema];

export const persorgSchema = new schema.Entity<Persorg>("persorgs", {
  creator: userSchema,
});
export const persorgsSchema = [persorgSchema];

const sentenceSchema = new schema.Union(
  {},
  (_value, parent) => parent.sentenceType
);
export const statementSchema = new schema.Entity<Statement>("statements", {
  speaker: persorgSchema,
  sentence: sentenceSchema,
  // justifications added below via justificationTargetSchema
});
export const statementsSchema = [statementSchema];
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
export const writsSchema = [writSchema];

export const writQuoteSchema = new schema.Entity<WritQuote>("writQuotes", {
  writ: writSchema,
});
export const writQuotesSchema = [writQuoteSchema];

export const picSchema = new schema.Entity<Pic>("pics");

export const picRegionSchema = new schema.Entity<PicRegion>("picRegions", {
  pic: picSchema,
});

export const vidSchema = new schema.Entity<Vid>("vids");

export const vidSegmentsSchema = new schema.Entity<VidSegment>("vidSegments", {
  vid: vidSchema,
});

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
  counterJustifications: [justificationSchema],
  vote: justificationVoteSchema,
});
export const justificationsSchema = [justificationSchema];
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
