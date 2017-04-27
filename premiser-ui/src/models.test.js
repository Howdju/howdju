import {
  decircularizeCounterJustification,
  decircularizeCounterJustifications, decircularTargetJustification, JustificationBasisType, JustificationPolarity,
  JustificationTargetType
} from './models'
import forEach from 'lodash/forEach'

describe('models', () => {
  describe('Justification', () => {

    describe('decircularTargetJustification', () => {
      test('should remove other properties from target', () => {
        const target = {
          type: JustificationTargetType.JUSTIFICATION,
          entity: {
            id: 42,
            target: {
              type: 'whatever',
              entity: {
                id: 128,
                blah: 'blah',
              }
            },
          }
        }
        expect(decircularTargetJustification(target)).toEqual({
          type: target.type,
          entity: { id: target.entity.id }
        })
      })
    })

    describe('decircularizeCounterJustification', () => {
      test('should skip non-counter-justifications', () => {
        const justification = {
          id: 1,
          target: {
            type: JustificationTargetType.STATEMENT,
          },
          polarity: JustificationPolarity.POSITIVE,
        }
        expect(decircularizeCounterJustification(justification)).toEqual(justification)
      })
      test('should decircularize counter-justifications', () => {
        const
            counterJustification = {
              id: 1,
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: {
                  id: 2,
                  target: {}
                }
              },
              polarity: JustificationPolarity.NEGATIVE,
            },
            decircularized = {
              id: 1,
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: {
                  id: 2,
                  // No circular target
                }
              },
              polarity: JustificationPolarity.NEGATIVE,
            }

        // This is our standard circularity right now
        counterJustification.target.entity.counterJustifications = [counterJustification]

        expect(decircularizeCounterJustification(counterJustification)).toEqual(decircularized)
      })
    })

    describe('decircularizeCounterJustifications', () => {

      test('decircularizes counter-justifications', () => {
        const counterJustifications = [
            {
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: {
                  id: 400,
                  target: {}
                },
              },
              polarity: JustificationPolarity.NEGATIVE,
            }
        ]
        const decircularizedCounterJustifications = [
            {
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: {
                  id: 400,
                  // No target
                },
              },
              polarity: JustificationPolarity.NEGATIVE,
            }
        ]
        // Create the circularity
        forEach(counterJustifications, cj => cj.target.entity.counterJustifications = [cj])

        expect(decircularizeCounterJustifications(counterJustifications)).toEqual(decircularizedCounterJustifications)
      })

      test('decircularizes the counter justifications of non-counter-justifications', () => {
        const justifications = [
          {
            id: 1,
            target: { type: JustificationTargetType.STATEMENT },
            counterJustifications: [
              {
                target: {
                  type: JustificationTargetType.JUSTIFICATION,
                  // Fill in entity here to create circularity
                },
                polarity: JustificationPolarity.NEGATIVE,
              }
            ],
            polarity: JustificationPolarity.POSITIVE,
          }
        ]
        forEach(justifications, j => forEach(j.counterJustifications, cj => cj.target.entity = j))

        const decircularizedJustifications = [
          {
            id: 1,
            target: { type: JustificationTargetType.STATEMENT },
            counterJustifications: [
              {
                target: {
                  type: JustificationTargetType.JUSTIFICATION,
                  entity: {
                    id: 1,
                    // No counter-justifications, no circularity
                  },
                },
                polarity: JustificationPolarity.NEGATIVE,
              }
            ],
            polarity: JustificationPolarity.POSITIVE,
          }
        ]

        expect(decircularizeCounterJustifications(justifications)).toEqual(decircularizedJustifications)
      })

      test('does nothing if a non-counter-justification has no counter-justifications', () => {
        const justifications = [
            {
            id: 1,
            basis: {
              type: JustificationBasisType.STATEMENT,
              entity: {
                id: 2,
                text: 'Hi there',
              }
            },
            target: {
              type: JustificationBasisType.STATEMENT,
              entity: {
                id: 2,
                text: 'Salutations',
              }
            }
          }
        ]
        expect(decircularizeCounterJustifications(justifications)).toEqual(justifications)
      })
    })

  })

})