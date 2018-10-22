import mergeWith from 'lodash/mergeWith'
import isArray from 'lodash/isArray'

import entities, {
  indexRootJustificationsByRootPropositionId,
  unionArraysDistinctIdsCustomizer,
} from './entities'
import {api, str, DELETE_JUSTIFICATION_SUCCESS} from "../actions"
import {JustificationPolarity, JustificationTargetType} from "howdju-common"


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

      describe('indexRootJustificationsByRootPropositionId', () => {
        test('should work', () => {
          const
            rootProposition = {
              id: 42,
            },
            justification = {
              id: 1,
              rootProposition: rootProposition.id,
              target: {
                type: JustificationTargetType.PROPOSITION,
                entity: {
                  id: rootProposition.id,
                },
              },
            },
            justificationsById = {
              [justification.id]: justification
            }

          expect(indexRootJustificationsByRootPropositionId(justificationsById)).toEqual({
            [justification.rootProposition]: [justification.id],
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

        test('should merge justificationsByRootPropositionId', () => {
          const
            targetProposition = {
              id: 1,
              text: 'target proposition',
            },
            basisProposition = {
              id: 2,
              text: 'basis proposition',
            },
            existingJustification = {
              id: 1,
              rootProposition: 1,
            },

            newJustification = {
              id: 2,
              rootProposition: 1,
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
              justificationsByRootPropositionId: {
                [existingJustification.rootProposition]: [existingJustification.id]
              }
            },

            action = {
              type: str(api.createJustification.response),
              payload: {
                result: {
                  justification: newJustification.id
                },
                entities: {
                  propositions: {
                    [targetProposition.id]: targetProposition,
                  },
                  justifications: {
                    [newJustification.id]: newJustification,
                  }
                },
              }
            },

            mergedJustificationsByRootPropositionId =
              initialState.justificationsByRootPropositionId[existingJustification.rootProposition].concat([newJustification.id]),
            expectedState = {
              propositions: {
                [targetProposition.id]: targetProposition,
              },
              justifications: {
                [existingJustification.id]: existingJustification,
                [newJustification.id]: newJustification,
              },
              justificationsByRootPropositionId: {
                [existingJustification.rootProposition]: mergedJustificationsByRootPropositionId
              },
            }
          const actual = entities(initialState, action)
          expect(actual).toEqual(expectedState)
        })

        test('should add counter-justifications to a target with no counter-justifications', () => {
          const
            targetJustification = {
              id: 1,
              rootProposition: {id: 1},
            },
            counterJustification = {
              id: 2,
              rootProposition: {id: 1},
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: targetJustification
              },
              polarity: JustificationPolarity.NEGATIVE,
            },
            expectedTargetJustification = {
              ...targetJustification,
              counterJustifications: [counterJustification.id]
            },
            initialState = {
              justifications: {
                [targetJustification.id]: targetJustification
              },
              justificationsByRootPropositionId: {
                [targetJustification.rootProposition.id]: [
                  targetJustification.id
                ]
              }
            },

            action = {
              type: str(api.createJustification.response),
              payload: {
                result: {
                  justification: counterJustification.id
                },
                entities: {
                  justifications: {
                    [counterJustification.id]: counterJustification,
                  }
                },
              }
            },

            expectedState = {
              justifications: {
                [expectedTargetJustification.id]: expectedTargetJustification,
                [counterJustification.id]: counterJustification,
              },
              justificationsByRootPropositionId: {
                [targetJustification.rootProposition.id]: [targetJustification.id]
              },
            }

          expect(entities(initialState, action)).toEqual(expectedState)
        })

        test('should add counter-justifications to a target with existing counter-justifications', () => {
          const
            existingCounterJustificationId = 3,
            targetJustification = {
              id: 1,
              rootProposition: {id: 1},
              counterJustifications: [existingCounterJustificationId]
            },
            counterJustification = {
              id: 2,
              rootProposition: {id: 1},
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
              justifications: {
                [targetJustification.id]: targetJustification
              },
              justificationsByRootPropositionId: {
                [targetJustification.rootProposition.id]: [
                  targetJustification.id
                ]
              }
            },

            action = {
              type: str(api.createJustification.response),
              payload: {
                result: {
                  justification: counterJustification.id
                },
                entities: {
                  justifications: {
                    [counterJustification.id]: counterJustification,
                  }
                },
              }
            },

            expectedState = {
              justifications: {
                [expectedTargetJustification.id]: expectedTargetJustification,
                [counterJustification.id]: counterJustification,
              },
              justificationsByRootPropositionId: {
                [targetJustification.rootProposition.id]: [targetJustification.id]
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

      describe('DELETE_JUSTIFICATION_SUCCESS', () => {
        test('should remove deleted counter-justification from countered justification', () => {
          const
            targetJustification = {
              rootProposition: {id: 2},
              id: 100,
            },
            counterJustification = {
              id: 42,
              target: {
                type: JustificationTargetType.JUSTIFICATION,
                entity: {
                  id: targetJustification.id,
                }
              },
              polarity: JustificationPolarity.NEGATIVE,
            },

            initialState = {
              justifications: {
                [targetJustification.id]: targetJustification,
                [counterJustification.id]: counterJustification,
              },
              justificationsByRootPropositionId: {
                [targetJustification.rootProposition.id]: targetJustification
              },
            },

            action = {
              type: DELETE_JUSTIFICATION_SUCCESS,
              meta: {
                requestPayload: {justification: counterJustification}
              },
            }

          // Add in counterJustification
          targetJustification.counterJustifications = [counterJustification.id]

          // Act
          const resultTargetJustification = entities(initialState, action).justifications[targetJustification.id]

          expect(resultTargetJustification.counterJustifications).not.toContainEqual(counterJustification)
        })
      })

    })
  })
})


