import { schema } from 'normalizr'

import {
  JustificationBasisCompoundAtomType,
  JustificationBasisType,
  JustificationRootTargetType,
  JustificationTargetType,
  SentenceType,
  SourceExcerptType,
} from 'howdju-common'

export const userSchema = new schema.Entity('users')

export const tagSchema = new schema.Entity('tags')
export const tagsSchema = [tagSchema]

export const propositionTagVoteSchema = new schema.Entity('propositionTagVotes', {
  tag: tagSchema
})
const propositionTagVoteSchemas = [propositionTagVoteSchema]

export const propositionSchema = new schema.Entity('propositions', {
  tags: tagsSchema,
  recommendedTags: tagsSchema,
  propositionTagVotes: propositionTagVoteSchemas,
  // justifications added below
})
export const propositionsSchema = [propositionSchema]

export const persorgSchema = new schema.Entity('persorgs', {
  creator: userSchema
})
export const persorgsSchema = [persorgSchema]

const sentenceSchema = new schema.Union({}, (value, parent) => parent.sentenceType)
export const statementSchema = new schema.Entity('statements', {
  speaker: persorgSchema,
  sentence: sentenceSchema,
  // justifications added below
})
sentenceSchema.define({
  [SentenceType.PROPOSITION]: propositionSchema,
  [SentenceType.STATEMENT]: statementSchema,
})

export const propositionCompoundSchema = new schema.Entity('propositionCompounds', {
  atoms: [{
    entity: propositionSchema,
  }],
})
export const writSchema = new schema.Entity('writs')
export const writsSchema = [writSchema]

export const writQuoteSchema = new schema.Entity('writQuotes', {
  writ: writSchema
})
export const writQuotesSchema = [writQuoteSchema]

export const picSchema = new schema.Entity('pics')

export const picRegionSchema = new schema.Entity('picRegions', {
  pic: picSchema,
})

export const vidSchema = new schema.Entity('vids')

export const vidSegmentsSchema = new schema.Entity('vidSegments', {
  vid: vidSchema
})

export const justificationVoteSchema = new schema.Entity('justificationVotes')

const sourceExcerptSchema = new schema.Union({
  [SourceExcerptType.WRIT_QUOTE]: writQuoteSchema,
  [SourceExcerptType.PIC_REGION]: picRegionSchema,
  [SourceExcerptType.VID_SEGMENT]: vidSegmentsSchema,
}, (value, parent) => parent.type)

export const sourceExcerptParaphraseSchema = new schema.Entity('sourceExcerptParaphrases', {
  paraphrasingProposition: propositionSchema,
  sourceExcerpt: {
    entity: sourceExcerptSchema
  },
})

export const justificationBasisCompoundAtomEntitySchema = new schema.Union({
  [JustificationBasisCompoundAtomType.PROPOSITION]: propositionSchema,
  [JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE]: sourceExcerptParaphraseSchema,
}, (value, parent) => parent.type)

export const justificationBasisCompoundSchema = new schema.Entity('justificationBasisCompounds', {
  atoms: [{
    entity: justificationBasisCompoundAtomEntitySchema
  }]
})

export const justificationTargetSchema = new schema.Union({}, (value, parent) => parent.type)
export const justificationBasisSchema = new schema.Union({
  [JustificationBasisType.PROPOSITION_COMPOUND]: propositionCompoundSchema,
  [JustificationBasisType.WRIT_QUOTE]: writQuoteSchema,
  [JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND]: justificationBasisCompoundSchema,
}, (value, parent) => parent.type)

const justificationRootTargetSchema = new schema.Union({
  [JustificationRootTargetType.STATEMENT]: statementSchema,
  [JustificationRootTargetType.PROPOSITION]: propositionSchema,
}, (value, parent) => parent.rootTargetType)

export const justificationSchema = new schema.Entity('justifications')
justificationSchema.define({
  rootTarget: justificationRootTargetSchema,
  target: {
    entity: justificationTargetSchema
  },
  basis: {
    entity: justificationBasisSchema
  },
  counterJustifications: [justificationSchema],
  vote: justificationVoteSchema
})
export const justificationsSchema = [justificationSchema]
// The docs say that this definition is merged, but for me it appeared to overwrite what was there, at least for Unions
justificationTargetSchema.define({
  [JustificationTargetType.PROPOSITION]: propositionSchema,
  [JustificationTargetType.STATEMENT]: statementSchema,
  [JustificationTargetType.JUSTIFICATION]: justificationSchema,
})

propositionSchema.define({
  justifications: justificationsSchema,
})
statementSchema.define({
  justifications: justificationsSchema,
})

export const perspectiveSchema = new schema.Entity('perspectives', {
  proposition: propositionSchema,
  justifications: justificationsSchema,
})
export const perspectivesSchema = [perspectiveSchema]

export const mainSearchResultsSchema = {
  propositionTexts: propositionsSchema,
  writQuoteQuoteTexts: writQuotesSchema,
  writQuoteUrls: writQuotesSchema,
  writTitles: writsSchema,
  tags: tagsSchema,
  persorgsFromName: persorgsSchema,
}
