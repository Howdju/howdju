import {LOCATION_CHANGE} from 'react-router-redux'
import { parsePath } from 'history/PathUtils';
import mergeWith from 'lodash/mergeWith'
import isArray from 'lodash/isArray'

import {
  entities,
  indexRootJustificationsByRootStatementId,
  unionArraysDistinctIdsCustomizer,
  appUi,
} from './reducers'
import paths from './paths'
import {CREATE_JUSTIFICATION_SUCCESS, DELETE_JUSTIFICATION_SUCCESS} from "./actions";
import {JustificationBasisType, JustificationPolarity, JustificationTargetType} from "./models";


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
  describe('indexRootJustificationsByRootStatementId', () => {
    test('should work', () => {
      const
          rootStatement = {
            id: 42,
          },
          justification = {
            id: 1,
            rootStatementId: rootStatement.id,
            target: {
              type: JustificationTargetType.STATEMENT,
              entity: {
                id: rootStatement.id,
              },
            },
          },
          justificationsById = {
            [justification.id]: justification
          }
      expect(indexRootJustificationsByRootStatementId(justificationsById)).toEqual({
        [justification.rootStatementId]: [justification.id],
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

  describe('entities', () => {
    describe('CREATE_JUSTIFICATION_SUCCESS', () => {

      test('should merge justificationsByRootStatementId', () => {
        const
            targetStatement = {
              id: 1,
              text: 'target statement',
            },
            basisStatement = {
              id: 2,
              text: 'basis statement',
            },
            existingJustification = {
              id: 1,
              rootStatementId: 1,
            },

            newJustification = {
              id: 2,
              rootStatementId: 1,
              target: {
                type: JustificationTargetType.STATEMENT,
                entity: targetStatement
              },
              basis: {
                type: JustificationTargetType.STATEMENT,
                entity: basisStatement
              },
            },

            initialState = {
              statements: {
                [targetStatement.id]: targetStatement,
              },
              justifications: {
                [existingJustification.id]: existingJustification
              },
              justificationsByRootStatementId: {
                [existingJustification.rootStatementId]: [existingJustification.id]
              }
            },

            action = {
              type: CREATE_JUSTIFICATION_SUCCESS,
              payload: {
                result: {
                  justification: newJustification.id
                },
                entities: {
                  statements: {
                    [targetStatement.id]: targetStatement,
                  },
                  justifications: {
                    [newJustification.id]: newJustification,
                  }
                },
              }
            },

            mergedJustificationsByRootStatementId =
              initialState.justificationsByRootStatementId[existingJustification.rootStatementId].concat([newJustification.id]),

            expectedState = {
              statements: {
                [targetStatement.id]: targetStatement,
              },
              justifications: {
                [existingJustification.id]: existingJustification,
                [newJustification.id]: newJustification,
              },
              justificationsByRootStatementId: {
                [existingJustification.rootStatementId]: mergedJustificationsByRootStatementId
              },
            }

        expect(entities(initialState, action)).toEqual(expectedState)
      })

      test('should add counter-justifications to a target with no counter-justifications', () => {
        const
            targetJustification = {
              id: 1,
              rootStatementId: 1,
            },
            counterJustification = {
              id: 2,
              rootStatementId: 1,
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
              justificationsByRootStatementId: {
                [targetJustification.rootStatementId]: [
                  targetJustification.id
                ]
              }
            },

            action = {
              type: CREATE_JUSTIFICATION_SUCCESS,
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
              justificationsByRootStatementId: {
                [targetJustification.rootStatementId]: [targetJustification.id]
              },
            }

        expect(entities(initialState, action)).toEqual(expectedState)
      })

      test('should add counter-justifications to a target with existing counter-justifications', () => {
        const
            existingCounterJustificationId = 3,
            targetJustification = {
              id: 1,
              rootStatementId: 1,
              counterJustifications: [existingCounterJustificationId]
            },
            counterJustification = {
              id: 2,
              rootStatementId: 1,
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
              justificationsByRootStatementId: {
                [targetJustification.rootStatementId]: [
                  targetJustification.id
                ]
              }
            },

            action = {
              type: CREATE_JUSTIFICATION_SUCCESS,
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
              justificationsByRootStatementId: {
                [targetJustification.rootStatementId]: [targetJustification.id]
              },
            }

        expect(entities(initialState, action)).toEqual(expectedState)
      })

      test('should handle counter-counter-justifications', () => {
        const responseBody = {
          justification: {
            id: 81,
            rootStatementId:19,
            target: {
              type: JustificationTargetType.JUSTIFICATION,
              // Justification
              entity: {
                id: 78,
                rootStatementId:19,
                // Justification
                target: {
                  type: JustificationTargetType.JUSTIFICATION,
                  entity: {
                    id: 49
                  }
                },
                basis: {
                  type: JustificationBasisType.STATEMENT,
                  entity: {
                    id: 75,
                    text: "Counter 5",
                    slug: "counter-5"
                  }
                },
                polarity: JustificationPolarity.NEGATIVE,
                vote: null,
                // TODO this is inaccurate: it has counter-justifications
                counterJustifications: []
              }
            },
            basis: {
              type: JustificationBasisType.STATEMENT,
              entity: {
                id: 77,
                text: "Counter counter to 5",
                slug: "counter-counter-to-5"
              }
            },
            polarity: JustificationPolarity.NEGATIVE
          }
        }

      })
    })

    describe('DELETE_JUSTIFICATION_SUCCESS', () => {
      test('should remove deleted counter-justification from countered justification', () => {
        const
            targetJustification = {
              rootStatementId: 2,
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
              justificationsByRootStatementId: {
                [targetJustification.rootStatementId]: targetJustification
              },
            },

            action = {
              type: DELETE_JUSTIFICATION_SUCCESS,
              meta: {
                deletedEntity: counterJustification
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

  describe('main search', () => {

    test('should clear the search text when navigating to a non-search page', () => {
      const initialState = {mainSearchText: 'non-empty'}
      const action = {
        type: LOCATION_CHANGE,
        payload: parsePath(paths.home()),
      }
      debugger
      const newState = appUi(initialState, action)
      expect(newState.mainSearchText).toEqual('')
    })

    test('should not clear the search when navigating to the search page', () => {
      const mainSearchText = 'non-empty'
      const initialState = {mainSearchText}
      const action = {
        type: LOCATION_CHANGE,
        payload: parsePath(paths.mainSearch(mainSearchText)),
      }
      const newState = appUi(initialState, action)
      expect(newState.mainSearchText).toEqual(mainSearchText)
    })

    test('should load search results on page load')

    test('should not load search results on navigation')
  })
})
