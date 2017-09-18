import { schema } from 'normalizr'

import {
  JustificationBasisCompoundAtomType,
  JustificationBasisType,
  JustificationTargetType,
  SourceExcerptType,
} from 'howdju-common'

export const statementSchema = new schema.Entity('statements')
export const statementsSchema = [statementSchema]
export const statementCompoundSchema = new schema.Entity('statementCompounds', {
  atoms: [{
    entity: statementSchema
  }]
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

export const voteSchema = new schema.Entity('votes')

const sourceExcerptSchema = new schema.Union({
  [SourceExcerptType.WRIT_QUOTE]: writQuoteSchema,
  [SourceExcerptType.PIC_REGION]: picRegionSchema,
  [SourceExcerptType.VID_SEGMENT]: vidSegmentsSchema,
}, (value, parent) => parent.type)

const sourceExcerptParaphraseSchema = new schema.Entity('sourceExcerptParaphrases', {
  paraphrasingStatement: statementSchema,
  sourceExcerpt: {
    entity: sourceExcerptSchema
  },
})

export const justificationBasisCompoundAtomEntitySchema = new schema.Union({
  [JustificationBasisCompoundAtomType.STATEMENT]: statementSchema,
  [JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE]: sourceExcerptParaphraseSchema,
}, (value, parent) => parent.type)

export const justificationBasisCompoundSchema = new schema.Entity('justificationBasisCompounds', {
  atoms: [{
    entity: justificationBasisCompoundAtomEntitySchema
  }]
})

export const justificationTargetSchema = new schema.Union({}, (value, parent) => parent.type)
export const justificationBasisSchema = new schema.Union({
  [JustificationBasisType.STATEMENT_COMPOUND]: statementCompoundSchema,
  [JustificationBasisType.WRIT_QUOTE]: writQuoteSchema,
  [JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND]: justificationBasisCompoundSchema,
}, (value, parent) => parent.type)

export const justificationSchema = new schema.Entity('justifications')
justificationSchema.define({
  rootStatement: statementSchema,
  target: {
    entity: justificationTargetSchema
  },
  basis: {
    entity: justificationBasisSchema
  },
  counterJustifications: [justificationSchema],
  vote: voteSchema
})
export const justificationsSchema = [justificationSchema]
// The docs say that this definition is merged, but for me it appeared to overwrite what was there.
justificationTargetSchema.define({
  [JustificationTargetType.STATEMENT]: statementSchema,
  [JustificationTargetType.JUSTIFICATION]: justificationSchema,
})

statementSchema.define({
  justifications: justificationsSchema,
})

export const statementJustificationsSchema = {
  statement: statementSchema,
  justifications: justificationsSchema
}

export const perspectiveSchema = new schema.Entity('perspectives', {
  statement: statementSchema,
  justifications: justificationsSchema,
})
export const perspectivesSchema = [perspectiveSchema]
