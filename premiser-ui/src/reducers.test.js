import {entities} from './reducers'
import {CREATE_JUSTIFICATION_SUCCESS} from "./actions";
import mergeWith from 'lodash/mergeWith'
import isArray from 'lodash/isArray'

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
                entity: targetStatement
              },
              basis: {
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
                entities: {
                  statements: {
                    [targetStatement.id]: targetStatement,
                  },
                  justifications: {
                    [newJustification.id]: newJustification,
                  }
                }
              }
            },

            expectedState = {
              statements: {
                [targetStatement.id]: targetStatement,
              },
              justifications: {
                [existingJustification.id]: existingJustification,
                [newJustification.id]: newJustification,
              },
              justificationsByRootStatementId: {
                [existingJustification.rootStatementId]: [existingJustification.id, newJustification.id]
              },
            }

        expect(entities(initialState, action)).toEqual(expectedState)
      })
    })
  })
})
