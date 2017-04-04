import { schema } from 'normalizr';

export const statementSchema = new schema.Entity('statements');
export const statementsSchema = [statementSchema]
export const quoteSchema = new schema.Entity('quotes')

export const justificationTargetSchema = new schema.Union({}, (value, parent) => parent.type)
export const justificationBasisSchema = new schema.Union({
  STATEMENT: statementSchema,
  QUOTE: quoteSchema
}, (value, parent) => parent.type)
export const justificationSchema = new schema.Entity('justifications', {
  target: {
    entity: justificationTargetSchema
  },
  basis: {
    entity: justificationBasisSchema
  }
})
// The docs say that this definition is merged, but for me it appeared to overwrite what was there.
justificationTargetSchema.define({
  STATEMENT: statementSchema,
  JUSTIFICATION: justificationSchema,
})

export const statementJustificationsSchema = {
  statement: statementSchema,
  justifications: [justificationSchema]
}