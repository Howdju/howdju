import map from 'lodash/map'
import { normalize } from 'normalizr'
import { propositionSchema} from './normalizationSchemas'

describe('normalizationSchemas', () => {

  describe('propositionSchema', () => {

    test('normalizes a proposition', () => {
      const json = { id: 1, text: 'a proposition' }
      const expected = { result: 1, entities: { propositions: { 1: json }}}
      expect(normalize(json, propositionSchema)).toEqual(expected)
    })

    test('normalizes a proposition with justifications', () => {
      const proposition1 = {
          id: 1,
          text: 'a proposition',
        },
        proposition2 = { id: 2, text: 'another proposition' },
        proposition3 = { id: 3, text: 'yet another proposition' },
        propositionCompound1 = {
          id: 4,
          atoms: [
            {entity: proposition2},
          ],
        },
        propositionCompound2 = {
          id: 5,
          atoms: [
            {entity: proposition3},
          ],
        },
        justification1 = {
          id: 1,
          // normalizer cannot normalize circular data
          target: { type: 'PROPOSITION', entity: {...proposition1} },
          basis: { type: 'PROPOSITION_COMPOUND', entity: {...propositionCompound1} },
        },
        justification2 = {
          id: 2,
          target: { type: 'PROPOSITION', entity: {...proposition1} },
          basis: { type: 'PROPOSITION_COMPOUND', entity: {...propositionCompound2} },
        }
      proposition1.justifications = [justification1, justification2]
      const expected = {
        result: 1,
        entities: {
          propositions: {
            1: {...proposition1, justifications: map(proposition1.justifications, (j) => j.id)},
            2: proposition2,
            3: proposition3,
          },
          justifications: {
            1: {
              ...justification1,
              target: { type: 'PROPOSITION', entity: { id: 1, schema: 'PROPOSITION' } },
              basis: { type: 'PROPOSITION_COMPOUND', entity: { id: 4, schema: 'PROPOSITION_COMPOUND' } },
            },
            2: {
              ...justification2,
              target: { type: 'PROPOSITION', entity: { id: 1, schema: 'PROPOSITION' } },
              basis: { type: 'PROPOSITION_COMPOUND', entity: { id: 5, schema: 'PROPOSITION_COMPOUND' } },
            },
          },
          propositionCompounds: {
            4: {
              atoms: [
                {entity: 2},
              ],
              id: 4,
            },
            5: {
              atoms: [
                {entity: 3},
              ],
              id: 5,
            },
          },
        },
      }

      expect(normalize(proposition1, propositionSchema)).toEqual(expected)
    })

  })
})
