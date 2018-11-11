import isArray from 'lodash/isArray'
import clone from 'lodash/clone'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'

import {
  JustificationPolarity,
  JustificationRootTargetType,
  JustificationTargetType,
  omitDeep,
} from "howdju-common"

import {api, str} from "../actions"
import entities, {
  unionArraysDistinctIdsCustomizer,
  makeUpdatesAddingJustificationsToTargets,
  makeUpdateRemovingJustificationFromTarget,
} from './entities'
import {
  justificationSchema
} from '../normalizationSchemas'


class ToOmit {}
const toOmit = new ToOmit()

describe('lodash', () => {
  describe('mergeWith', () => {
    test('Should customize merge', () => {
      const mergeArraysCustomizer = (destVal, srcVal) => {
        if (isArray(destVal) && isArray(srcVal)) {
          return destVal.concat(srcVal)
        }
      }
      expect(mergeWith({}, {a: [0]}, {a: [1]}, mergeArraysCustomizer)).toEqual({a: [0, 1]})
    })
  })
})


describe('reducers', () => {

  describe('entities', () => {

    describe('helpers', () => {

      describe('makeUpdatesAddingJustificationsToTargets', () => {
        test('should work', () => {
          const
            rootProposition = {
              id: "42",
            },
            justification = {
              id: "1",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: {id: rootProposition.id},
              target: {
                type: JustificationTargetType.PROPOSITION,
                entity: {
                  id: rootProposition.id,
                },
              },
            },
            entities = {
              propositions: {
                [rootProposition.id]: rootProposition,
              },
              justifications: {
                [justification.id]: justification
              }
            },
            state = {
              propositions: {
                [rootProposition.id]: rootProposition
              }
            }

          expect(makeUpdatesAddingJustificationsToTargets(entities, state)).toEqual({
            propositions: {
              [rootProposition.id]: {
                ...rootProposition,
                justifications: [justification.id]
              }
            },
          })
        })
      })

      describe('makeUpdateRemovingJustificationFromTarget', () => {
        test('should work', () => {
          const
            rootProposition = {
              id: 42,
            },
            justification = {
              id: 1,
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: {id: rootProposition.id},
              target: {
                type: JustificationTargetType.PROPOSITION,
                entity: {
                  id: rootProposition.id,
                },
              },
            },
            state = {
              propositions: {
                [rootProposition.id]: rootProposition
              }
            }
          rootProposition.justifications = [justification.id]

          expect(makeUpdateRemovingJustificationFromTarget(justification, state)).toEqual({
            propositions: {
              [rootProposition.id]: {
                ...rootProposition,
                justifications: []
              }
            },
          })
        })
      })

      describe('unionArraysDistinctIdsCustomizer', () => {

        test('should handle empty arrays', () => {
          expect(unionArraysDistinctIdsCustomizer([], [])).toEqual([])

          const array = [1, 2, 3]
          expect(unionArraysDistinctIdsCustomizer(array, [])).toEqual(array)
          expect(unionArraysDistinctIdsCustomizer([], array)).toEqual(array)
        })

        test('should overwrite dest vals with src vals having the same ID', () => {
          const dest = [
            {
              id: 1,
              text: 'dest',
            },
            {
              id: 2,
              text: 'dest',
            }
          ]
          const src = [
            {
              id: 1,
              text: 'src',
            }
          ]

          expect(unionArraysDistinctIdsCustomizer(dest, src)).toEqual([
            {
              id: 1,
              text: 'src',
            },
            {
              id: 2,
              text: 'dest',
            },
          ])
        })

        test('should copy dest and src vals having no IDs in-order', () => {
          const dest = [
            {
              id: 1,
              text: 'dest',
            },
            {
              text: 'dest no-id'
            },
            {
              id: 2,
              text: 'dest',
            },
          ]
          const src = [
            {
              id: 1,
              text: 'src',
            },
            {
              text: 'src no-id',
            },
            {
              id: 2,
              text: 'src',
            }
          ]

          expect(unionArraysDistinctIdsCustomizer(dest, src)).toEqual([
            {
              id: 1,
              text: 'src',
            },
            {
              text: 'dest no-id'
            },
            {
              id: 2,
              text: 'src',
            },
            // Comes after id:2 because id:2 replaces id:2 from dest and dest items will come first
            {
              text: 'src no-id',
            },
          ])
        })

        test('should include only the last val having the same ID as an earlier one from the dest', () => {
          const dest = [
            {
              id: 1,
              text: 'dest-first',
            },
            {
              id: 1,
              text: 'dest-second',
            },
          ]
          const src = [
            {
              text: 'src no-id',
            },
          ]

          expect(unionArraysDistinctIdsCustomizer(dest, src)).toEqual([
            {
              id: 1,
              text: 'dest-second',
            },
            {
              text: 'src no-id',
            },
          ])
        })

        test('should include only the last val having the same ID as an earlier one from the src', () => {
          const dest = [
            {
              text: 'dest',
            },
          ]
          const src = [
            {
              id: 1,
              text: 'src-first',
            },
            {
              id: 1,
              text: 'src-second',
            },
          ]

          expect(unionArraysDistinctIdsCustomizer(dest, src)).toEqual([
            {
              text: 'dest',
            },
            {
              id: 1,
              text: 'src-second',
            },
          ])
        })

        test('should return undefined for non-arrays', () => {
          expect(unionArraysDistinctIdsCustomizer('string', [])).toBeUndefined()
          expect(unionArraysDistinctIdsCustomizer([], 42)).toBeUndefined()
        })
      })

    })

    describe('actions', () => {

      describe(str(api.createJustification.response), () => {

        test('should add justifications to targets', () => {
          const
            targetProposition = {
              id: "1",
              text: 'target proposition',
            },
            basisProposition = {
              id: "2",
              text: 'basis proposition',
            },
            existingJustification = {
              id: "1",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: clone(targetProposition),
              target: {type: JustificationTargetType.PROPOSITION, entity: clone(targetProposition)}
            },

            newJustification = {
              id: "2",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: {id: "1"},
              target: {
                type: JustificationTargetType.PROPOSITION,
                entity: targetProposition
              },
              basis: {
                type: JustificationTargetType.PROPOSITION,
                entity: basisProposition
              },
            },

            initialState = {
              propositions: {
                [targetProposition.id]: targetProposition,
              },
              justifications: {
                [existingJustification.id]: existingJustification
              },
            },

            action = api.createJustification.response(
              {justification: newJustification},
              {normalizationSchema: {justification: justificationSchema}}
            )

          targetProposition.justifications = [existingJustification.id]

          const expectedState = omitDeep({
            propositions: {
              [targetProposition.id]: {
                ...targetProposition,
                justifications: [...targetProposition.justifications, newJustification.id],
              },
            },
            justifications: {
              [existingJustification.id]: existingJustification,
              [newJustification.id]: merge(
                {},
                newJustification,
                {
                  target: {entity: {text: toOmit, justifications: toOmit, schema: JustificationTargetType.PROPOSITION}},
                  rootTarget: {schema: JustificationRootTargetType.PROPOSITION},
                }
              ),
            },
          }, (val) => val === toOmit)

          const actual = entities(initialState, action)

          expect(actual).toEqual(expectedState)
        })

        test('should add counter-justifications to a target with no counter-justifications', () => {
          const
            rootProposition = {id: "1"},
            targetJustification = {
              id: "2",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: rootProposition,
              target: {
                type: JustificationTargetType.PROPOSITION,
                entity: rootProposition,
              },
            }
          const counterJustification = {
              id: "3",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: rootProposition,
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: targetJustification
              },
              polarity: JustificationPolarity.NEGATIVE,
            },
            initialState = {
              propositions: {
                [rootProposition.id]: rootProposition
              },
              justifications: {
                [targetJustification.id]: targetJustification
              },
            },

            action = api.createJustification.response(
              {justification: counterJustification},
              {normalizationSchema: {justification: justificationSchema}},
            ),

            expectedState = {
              propositions: {
                [rootProposition.id]: {
                  ...rootProposition,
                  justifications: [targetJustification.id]
                }
              },
              justifications: {
                [targetJustification.id]: merge(
                  {},
                  targetJustification,
                  {
                    counterJustifications: [counterJustification.id],
                    rootTarget: {schema: JustificationRootTargetType.PROPOSITION},
                    target: {
                      entity: {
                        schema: JustificationTargetType.PROPOSITION,
                      }
                    },
                  },
                ),
                [counterJustification.id]: omitDeep(merge(
                  {},
                  counterJustification,
                  {
                    target: {entity: {
                      schema: JustificationTargetType.JUSTIFICATION,
                      rootTarget: toOmit,
                      rootTargetType: toOmit,
                      target: toOmit
                    }},
                    rootTarget: {schema: JustificationRootTargetType.PROPOSITION},
                  }
                ), (val) => val === toOmit),
              },
            }

          expect(entities(initialState, action)).toEqual(expectedState)
        })

        test('should add counter-justifications to a target with existing counter-justifications', () => {
          const
            existingCounterJustificationId = "3",
            rootProposition = {id: "1"},
            targetJustification = {
              id: "2",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: rootProposition,
              target: {
                type: JustificationTargetType.PROPOSITION,
                entity: rootProposition,
              },
              counterJustifications: [existingCounterJustificationId]
            },
            counterJustification = {
              id: "4",
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: rootProposition,
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: targetJustification
              },
              polarity: JustificationPolarity.NEGATIVE,
            },
            expectedTargetJustification = {
              ...targetJustification,
              counterJustifications: [
                existingCounterJustificationId,
                counterJustification.id,
              ]
            },

            initialState = {
              propositions: {
                [rootProposition.id]: rootProposition,
              },
              justifications: {
                [targetJustification.id]: targetJustification
              },
            },

            action = api.createJustification.response(
              {justification: counterJustification},
              {normalizationSchema: {justification: justificationSchema}},
            ),

            expectedState = {
              propositions: {
                [rootProposition.id]: {...rootProposition, justifications: [targetJustification.id]}
              },
              justifications: {
                [expectedTargetJustification.id]: merge(
                  {},
                  expectedTargetJustification,
                  {rootTarget: {schema: JustificationRootTargetType.PROPOSITION}},
                  {target: {entity: {schema: JustificationRootTargetType.PROPOSITION}}},
                ),
                [counterJustification.id]: omitDeep(merge(
                  {},
                  counterJustification,
                  {
                    target: {entity: {
                      schema: JustificationTargetType.JUSTIFICATION,
                      rootTarget: toOmit,
                      rootTargetType: toOmit,
                      counterJustifications: toOmit,
                      target: toOmit,
                    }},
                    rootTarget: {schema: JustificationRootTargetType.PROPOSITION},
                  },
                  {rootTarget: {schema: JustificationRootTargetType.PROPOSITION}},
                ), (val) => val === toOmit),
              },
            }

          expect(entities(initialState, action)).toEqual(expectedState)
        })

        test('should handle counter-counter-justifications', () => {
          // const responseBody = {
          //   justification: {
          //     id: 81,
          //     rootProposition: {id:19},
          //     target: {
          //       type: JustificationTargetType.JUSTIFICATION,
          //       // Justification
          //       entity: {
          //         id: 78,
          //         rootProposition: {id:19},
          //         // Justification
          //         target: {
          //           type: JustificationTargetType.JUSTIFICATION,
          //           entity: {
          //             id: 49
          //           }
          //         },
          //         basis: {
          //           type: JustificationBasisType.PROPOSITION_COMPOUND,
          //           entity: {
          //             atoms: [
          //               {
          //                 proposition: {
          //                   id: 75,
          //                   text: "Counter 5",
          //                   slug: "counter-5"
          //                 }
          //               }
          //             ]
          //           }
          //         },
          //         polarity: JustificationPolarity.NEGATIVE,
          //         vote: null,
          //         // TODO this is inaccurate: it has counter-justifications
          //         counterJustifications: []
          //       }
          //     },
          //     basis: {
          //       type: JustificationBasisType.PROPOSITION_COMPOUND,
          //       entity: {
          //         atoms: [
          //           {
          //             proposition: {
          //               id: 77,
          //               text: "Counter counter to 5",
          //               slug: "counter-counter-to-5"
          //             }
          //           }
          //         ]
          //       }
          //     },
          //     polarity: JustificationPolarity.NEGATIVE
          //   }
          // }

        })
      })

      describe(str(api.deleteJustification.response), () => {
        test('should remove deleted counter-justification from countered justification', () => {
          const
            rootProposition = {id: "1"},
            targetJustification = {
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: rootProposition,
              id: "2",
            },
            counterJustification = {
              id: "3",
              polarity: JustificationPolarity.NEGATIVE,
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: targetJustification
              },
              rootTargetType: JustificationRootTargetType.PROPOSITION,
              rootTarget: rootProposition,
            },

            initialState = {
              justifications: {
                [targetJustification.id]: targetJustification,
                [counterJustification.id]: counterJustification,
              },
            },

            action = api.deleteJustification.response(null, {requestPayload: {justification: counterJustification}})
          targetJustification.counterJustifications = [counterJustification.id]

          const actualState = entities(initialState, action)

          const actualCounterJustifications = actualState.justifications[targetJustification.id].counterJustifications
          expect(actualCounterJustifications).not.toContainEqual(counterJustification.id)
        })
      })

    })
  })
})
