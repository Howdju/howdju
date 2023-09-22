import { merge } from "lodash";
import { schema } from "normalizr";

import {
  AccountSettings,
  AppearanceOut,
  ContextTrailItem,
  JustificationView,
  JustificationVote,
  MediaExcerptCitationIdentifier,
  MediaExcerptCitationOut,
  MediaExcerptCitationView,
  MediaExcerptOut,
  MediaExcerptSpeakerView,
  mergeCopy,
  PersorgOut,
  PicRegion,
  PropositionCompoundAtomOut,
  PropositionCompoundAtomView,
  PropositionCompoundView,
  PropositionOut,
  PropositionTagVote,
  SourceExcerptParaphrase,
  SourceOut,
  StatementOut,
  TagOut,
  TagVote,
  toSlug,
  UrlLocatorOut,
  UrlOut,
  UserOut,
  VidSegment,
  Writ,
  WritQuote,
} from "howdju-common";

import { applyCustomizations, momentConversion } from "./normalizationUtil";

export const userSchema = new schema.Entity<UserOut>("users");
export const usersSchema = new schema.Array(userSchema);

export const tagSchema = new schema.Entity<TagOut>("tags");
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

export const propositionSchema = new schema.Entity<PropositionOut>(
  "propositions",
  {
    tags: tagsSchema,
    tagVotes: tagVotesSchema,
    recommendedTags: tagsSchema,
    propositionTagVotes: propositionTagVotesSchema,
    // justifications added below via justificationTargetSchema
  },
  {
    processStrategy: (value) => ({
      ...value,
      key: value.id,
      slug: toSlug(value.text),
    }),
  }
);
export const propositionsSchema = new schema.Array(propositionSchema);

export const persorgSchema = new schema.Entity<PersorgOut>(
  "persorgs",
  {
    creator: userSchema,
  },
  {
    processStrategy: (value) => ({
      ...value,
      key: value.id,
    }),
  }
);
export const persorgsSchema = new schema.Array(persorgSchema);

const sentenceSchema = new schema.Union(
  {},
  (_value, parent) => parent.sentenceType
);
export const statementSchema = new schema.Entity<StatementOut>("statements", {
  speaker: persorgSchema,
  sentence: sentenceSchema,
  // justifications added below via justificationTargetSchema
});
export const statementsSchema = new schema.Array(statementSchema);
sentenceSchema.define({
  PROPOSITION: propositionSchema,
  STATEMENT: statementSchema,
});

function propositionCompoundAtomKey(atom: PropositionCompoundAtomOut) {
  return `${atom.propositionCompoundId}-${atom.entity.id}`;
}
export const propositionCompoundAtomSchema =
  new schema.Entity<PropositionCompoundAtomView>(
    "propositionCompoundAtoms",
    {
      entity: propositionSchema,
    },
    {
      idAttribute: propositionCompoundAtomKey,
      processStrategy(atom) {
        return mergeCopy(atom, {
          key: propositionCompoundAtomKey(atom),
        });
      },
    }
  );
export const propositionCompoundAtomsSchema = new schema.Array(
  propositionCompoundAtomSchema
);

export const propositionCompoundSchema =
  new schema.Entity<PropositionCompoundView>("propositionCompounds", {
    atoms: propositionCompoundAtomsSchema,
  });
export const propositionCompoundsSchema = new schema.Array(
  propositionCompoundSchema
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

export const urlSchema = new schema.Entity<UrlOut>("urls");
export const urlsSchema = new schema.Array(urlSchema);

export const urlLocatorSchema = new schema.Entity<UrlLocatorOut>(
  "urlLocators",
  {
    url: urlSchema,
  },
  {
    processStrategy: (value) =>
      applyCustomizations(
        merge({}, value, {
          key: value.id,
        }),
        momentConversion("created"),
        momentConversion("autoConfirmationStatus.latestFoundAt"),
        momentConversion("autoConfirmationStatus.earliestFoundAt"),
        momentConversion("autoConfirmationStatus.latestNotFoundAt"),
        momentConversion("autoConfirmationStatus.earliestNotFoundAt")
      ),
  }
);
export const urlLocatorsSchema = new schema.Array(urlLocatorSchema);

export const sourceSchema = new schema.Entity<SourceOut>("sources");
export const sourcesSchema = new schema.Array(sourceSchema);

export function mediaExcerptCitationKey(
  citation: MediaExcerptCitationOut
): string;
export function mediaExcerptCitationKey(
  citationIdentifier: MediaExcerptCitationIdentifier
): string;
export function mediaExcerptCitationKey(
  model: MediaExcerptCitationOut | MediaExcerptCitationIdentifier
): string {
  const { mediaExcerptId, normalPincite } = model;
  const sourceId = "source" in model ? model.source.id : model.sourceId;

  // toMediaExcerptCitationIdentifier
  return `${mediaExcerptId}-${sourceId}${
    normalPincite ? "-" + normalPincite : ""
  }`;
}
export const mediaExcerptCitationSchema =
  new schema.Entity<MediaExcerptCitationView>(
    "mediaExcerptCitations",
    {
      source: sourceSchema,
    },
    {
      idAttribute: mediaExcerptCitationKey,
      processStrategy(citation) {
        return applyCustomizations(
          mergeCopy(citation, {
            key: mediaExcerptCitationKey(citation),
          }),
          momentConversion("created")
        );
      },
    }
  );
export const mediaExcerptCitationsSchema = new schema.Array(
  mediaExcerptCitationSchema
);

export const mediaExcerptSpeakerSchema =
  new schema.Entity<MediaExcerptSpeakerView>(
    "mediaExcerptSpeakers",
    {
      persorg: persorgSchema,
    },
    {
      idAttribute(speaker) {
        return `${speaker.mediaExcerptId}-${speaker.persorg.id}`;
      },
    }
  );
export const mediaExcerptSpeakersSchema = new schema.Array(
  mediaExcerptSpeakerSchema
);

export const mediaExcerptSchema = new schema.Entity<MediaExcerptOut>(
  "mediaExcerpts",
  {
    locators: {
      urlLocators: urlLocatorsSchema,
    },
    citations: mediaExcerptCitationsSchema,
    speakers: mediaExcerptSpeakersSchema,
  }
);
export const mediaExcerptsSchema = new schema.Array(mediaExcerptSchema);

export const justificationTargetSchema = new schema.Union(
  {},
  (_value, parent) => parent.type
);
export const justificationBasisSchema = new schema.Union(
  {
    PROPOSITION_COMPOUND: propositionCompoundSchema,
    WRIT_QUOTE: writQuoteSchema,
    MEDIA_EXCERPT: mediaExcerptSchema,
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

export const justificationSchema = new schema.Entity<JustificationView>(
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

export const accountSettingsSchema = new schema.Entity<AccountSettings>(
  "accountSettings"
);

export const appearanceSchema = new schema.Entity<AppearanceOut>(
  "appearances",
  {
    mediaExcerpt: mediaExcerptSchema,
    apparition: {
      entity: new schema.Union(
        {
          PROPOSITION: propositionSchema,
        },
        (_value, parent) => parent.type
      ),
    },
  }
);
export const appearancesSchema = new schema.Array(appearanceSchema);

const connectingEntitySchema = new schema.Union(
  {
    JUSTIFICATION: justificationSchema,
    APPEARANCE: appearanceSchema,
  },
  (_value, parent) => parent.connectingEntityType
);
export const contextTrailItemSchema = new schema.Entity<ContextTrailItem>(
  "contextTrailItems",
  {
    connectingEntity: connectingEntitySchema,
  }
);
export const contextTrailItemsSchema = new schema.Array(contextTrailItemSchema);

export const mainSearchResultSchema = {
  mediaExcerpts: mediaExcerptsSchema,
  persorgs: persorgsSchema,
  propositions: propositionsSchema,
  sources: sourcesSchema,
  tags: tagsSchema,
};

export const normalizationSchemaByEntityType = {
  JUSTIFICATION: justificationSchema,
  APPEARANCE: appearanceSchema,
  PROPOSITION: propositionSchema,
  STATEMENT: statementSchema,
} as const;

// TODO(482) remove this.
export const nullSchema = new schema.Entity<null>("null");

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
