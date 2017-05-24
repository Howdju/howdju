import { normalize } from 'normalizr';
import { statementSchema, statementJustificationsSchema} from './schemas'

describe('schemas', () => {

  test('statementSchema', () => {
    const json = { id: 1, text: 'a statement' }
    const expected = { result: 1, entities: { statements: { 1: json }}}
    expect(normalize(json, statementSchema)).toEqual(expected)
  })

  test('statementJustificationsSchema', () => {
    const statement1 = { id: 1, text: 'a statement' },
        statement2 = { id: 2, text: 'another statement' },
        statement3 = { id: 3, text: 'yet another statement' },
        justification1 = {
          id: 1,
          target: { type: 'STATEMENT', entity: statement1 },
          basis: { type: 'STATEMENT', entity: statement2 }
        },
        justification2 = {
          id: 2,
          target: { type: 'STATEMENT', entity: statement1 },
          basis: { type: 'STATEMENT', entity: statement3 }
        };
    const json = {
      statement: statement1,
      justifications: [justification1, justification2]
    }
    const expected = {
      result: {
        statement: 1,
        justifications: [1, 2],
      },
      entities: {
        statements: {
          1: statement1,
          2: statement2,
          3: statement3,
        },
        justifications: {
          1: {...justification1, target: { type: 'STATEMENT', entity: { id: 1, schema: 'STATEMENT' } }, basis: { type: 'STATEMENT', entity: { id: 2, schema: 'STATEMENT' } } },
          2: {...justification2, target: { type: 'STATEMENT', entity: { id: 1, schema: 'STATEMENT' } }, basis: { type: 'STATEMENT', entity: { id: 3, schema: 'STATEMENT' } } },
        },
      }
    }

    expect(normalize(json, statementJustificationsSchema)).toEqual(expected)
  })
})
