import { schema } from 'normalizr'

export const statementSchema = new schema.Entity('statements')
export const statementsSchema = [statementSchema]
export const statementCompoundSchema = new schema.Entity('statementCompounds', {
  atoms: [
    {
      statement: statementSchema
    }
  ]
})
export const writingSchema = new schema.Entity('writings')
export const writingsSchema = [writingSchema]
export const writingQuoteSchema = new schema.Entity('writingQuotes', {
  writing: writingSchema
})
export const writingQuotesSchema = [writingQuoteSchema]
export const voteSchema = new schema.Entity('votes')

export const justificationTargetSchema = new schema.Union({}, (value, parent) => parent.type)
export const justificationBasisSchema = new schema.Union({
  STATEMENT_COMPOUND: statementCompoundSchema,
  WRITING_QUOTE: writingQuoteSchema
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
  STATEMENT: statementSchema,
  JUSTIFICATION: justificationSchema,
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