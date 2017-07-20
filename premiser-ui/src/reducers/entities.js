import isArray from 'lodash/isArray'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'
import groupBy from 'lodash/groupBy'
import pickBy from 'lodash/pickBy'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import values from 'lodash/values'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import clone from 'lodash/clone'
import filter from 'lodash/filter'
import union from 'lodash/union'
import isNumber from 'lodash/isNumber'
import {combineActions, handleActions} from "redux-actions";

import {
  isCounter,
  JustificationTargetType,
  VoteTargetType
} from '../models'
import {api} from '../actions'
import * as httpStatusCodes from "../httpStatusCodes";
import {normalize} from "normalizr";
import {statementSchema} from "../schemas";
import {assert} from './../util'

export const unionArraysDistinctIdsCustomizer = (destVal, srcVal) => {
  if (isArray(destVal) && isArray(srcVal)) {
    // For values that have IDs, overwrite dest values
    const seenDestIdIndices = {}
    const seenSrcIdIndices = {}
    const filteredDestVals = []
    const filteredSrcVals = []
    forEach(destVal, val => {
      if (val && val.id) {
        if (!isNumber(seenDestIdIndices[val.id])) {
          filteredDestVals.push(val)
          seenDestIdIndices[val.id] = filteredDestVals.length - 1
        } else {
          filteredDestVals[seenDestIdIndices[val.id]] = val
        }
      } else {
        // If the value lacks an ID, just merge it
        filteredDestVals.push(val)
      }
    })

    forEach(srcVal, val => {
      if (val && val.id && isNumber(seenDestIdIndices[val.id])) {
        // Overwrite dest items having the same ID
        filteredDestVals[seenDestIdIndices[val.id]] = val
      } else if (val && val.id && isNumber(seenSrcIdIndices[val.id])) {
        filteredSrcVals[seenSrcIdIndices[val.id]] = val
      } else if (val && val.id) {
        filteredSrcVals.push(val)
        seenSrcIdIndices[val.id] = filteredSrcVals.length - 1
      } else {
        // If the value lacks an ID, just merge it
        filteredSrcVals.push(val)
      }
    })
    return union(filteredDestVals, filteredSrcVals)
  }
  return undefined // tells lodash to use its default method
}

export const indexRootJustificationsByRootStatementId = justificationsById => {
  const justifications = values(justificationsById)
  const rootJustifications = filter(justifications, j =>
      // TODO do we need a more thorough approach to ensuring that only fully entities are present?
      // I'd like to send/receive them as stubs, and denormalize them somewhere standard
      // Some justifications that come back are stubs and will lack relations like .target
      j.target &&
      j.target.type === JustificationTargetType.STATEMENT &&
      j.target.entity.id === j.rootStatementId
  )
  let rootJustificationsByRootStatementId = groupBy(rootJustifications, j => j.rootStatementId)
  rootJustificationsByRootStatementId = mapValues(rootJustificationsByRootStatementId, (justifications, rootStatementId) => map(justifications, j => j.id))
  // for (let statementId of Object.keys(justificationsByRootStatementId)) {
  //   justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => j.id)
  //   // justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => normalize(j, justificationSchema).result)
  // }
  return rootJustificationsByRootStatementId
}

export default handleActions({
  [combineActions(
      api.fetchStatement.response,
      api.fetchStatements.response,
      api.fetchRecentStatements.response,
      api.fetchMoreRecentStatements.response,
  )]: {
    next: (state, action) => ({...state, statements: {...state.statements, ...action.payload.entities.statements}})
  },
  [combineActions(
      api.fetchStatementJustifications.response,
      api.fetchFeaturedPerspectives.response
  )]: {
    next: (state, action) => {
      const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)
      return {
        ...state,
        perspectives: {...state.perspectives, ...action.payload.entities.perspectives},
        statements: {...state.statements, ...action.payload.entities.statements},
        statementCompounds: {...state.statementCompounds, ...action.payload.entities.statementCompounds},
        justifications: {...state.justifications, ...action.payload.entities.justifications},
        votes: {...state.votes, ...action.payload.entities.votes},
        justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, unionArraysDistinctIdsCustomizer),
        citationReferences: {...state.citationReferences, ...action.payload.entities.citationReferences},
      }
    },
    throw: (state, action) => {
      // If a statement is not found (e.g., another user deleted it), then remove it.
      if (action.httpStatusCode === httpStatusCodes.NOT_FOUND) {
        return {
          ...state,
          statements: pickBy(state.statements, (s, id) => +id !== action.meta.statementId)
        }
      }
      return state
    }
  },
  [api.fetchCitationReference]: {
    next: (state, action) => ({...state, citationReferences: {...state.citationReferences, ...action.payload.entities.citationReferences}})
  },
  [api.createStatement.response]: {
    next: (state, action) => ({
      ...state,
      statements: {...state.statements, ...action.payload.entities.statements},
    })
  },
  [api.updateStatement.response]: {
    next: (state, action) => ({
      ...state,
      statements: {...state.statements, ...action.payload.entities.statements}
    })
  },
  [api.deleteStatement.response]: {
    next: (state, action) => ({
      ...state,
      statements: pickBy(state.statements, (s, id) => +id !== action.meta.requestPayload.statement.id )
    })
  },
  [api.createJustification.response]: {
    next: (state, action) => {
      const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)

      // if counter, add to counter justifications
      const justificationId = action.payload.result.justification
      const justification = action.payload.entities.justifications[justificationId]
      let counteredJustifications = {}
      if (isCounter(justification)) {
        const counteredJustification = state.justifications[justification.target.entity.id]
        counteredJustification.counterJustifications = counteredJustification.counterJustifications ?
            counteredJustification.counterJustifications.concat([justification.id]) :
            [justification.id]
        counteredJustifications = {justifications: { [counteredJustification.id]: counteredJustification }}
      }

      return mergeWith(
          {},
          state,
          action.payload.entities,
          counteredJustifications,
          // TODO this doesn't seem right; should be {justifications: {1: ..., 2: ...}}, but this would be like {justificationByRootStatementId: {1: ..., 2: ...}}
          {justificationsByRootStatementId},
          unionArraysDistinctIdsCustomizer,
      )
    }
  },
  [api.deleteJustification.response]: {
    next: (state, action) => {
      const deletedJustification = action.meta.requestPayload.justification
      const justificationsByRootStatementId = cloneDeep(state.justificationsByRootStatementId)
      justificationsByRootStatementId[deletedJustification.rootStatementId] =
          filter(justificationsByRootStatementId[deletedJustification.rootStatementId], id => id !== deletedJustification.id)

      // If the deleted justification was a counter-justification, remove it from the target justification's counterJustifications
      let justifications = state.justifications
      if (isCounter(deletedJustification)) {
        const counteredJustificationId = deletedJustification.target.entity.id
        let counteredJustification = justifications[counteredJustificationId]
        counteredJustification = cloneDeep(counteredJustification)
        counteredJustification.counterJustifications = filter(counteredJustification.counterJustifications, cjId => cjId !== deletedJustification.id)
        justifications = clone(justifications)
        justifications[counteredJustificationId] = counteredJustification
      }

      return {
        ...state,
        justifications: pickBy(justifications, (j, id) => +id !== deletedJustification.id ),
        justificationsByRootStatementId
      }
    }
  },
  [api.updateCitationReference.response]: {
    next: (state, action) => ({
      ...state,
      citationReferences: {
        ...state.citationReferences,
        ...action.payload.entities.citationReferences
      }
    })
  },

  [combineActions(
      api.verifyJustification,
      api.disverifyJustification
  )]: (state, action) => {
    const vote = action.payload.vote
    const {targetId, targetType} = vote
    assert(() => targetType === VoteTargetType.JUSTIFICATION)
    const currJustification = state.justifications[targetId]
    // Optimistically apply vote
    const justification = merge({}, currJustification, {vote})
    return {
      ...state,
      justifications: {...state.justifications, [justification.id]: justification},
    }
  },
  [combineActions(
      api.unVerifyJustification,
      api.unDisverifyJustification
  )]: (state, action) => {
    const {
      targetId,
    } = action.payload.vote
    const currJustification = state.justifications[targetId]
    // Optimistically remove vote
    const justification = merge({}, currJustification, {vote: null})
    return {
      ...state,
      justifications: {...state.justifications, [justification.id]: justification},
    }
  },
  [combineActions(
      api.verifyJustification.response,
      api.disverifyJustification.response
  )]: {
    next: (state, action) => {
      const vote = action.payload.entities.votes[action.payload.result.vote]
      const currJustification = state.justifications[vote.targetId]
      const justification = {...currJustification, vote}
      return {
        ...state,
        justifications: {...state.justifications, [justification.id]: justification},
        votes: {...state.votes, ...action.payload.entities.votes},
      }
    }
  },
  [combineActions(
      api.verifyJustification.response,
      api.unVerifyJustification.response,
      api.disverifyJustification.response,
      api.unDisverifyJustification.response
  )]: {
    throw: (state, action) => {
      // Undo optimistic vote
      const {
        vote: {
          targetId
        },
        previousVote,
      } = action.meta.requestPayload
      const currJustification = state.justifications[targetId]
      const justification = merge({}, currJustification, {vote: previousVote})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[targetId]: justification}),
      }
    }
  },

  [api.fetchStatementTextSuggestions.response]: {
    next: (state, action) => {
      const normalized = normalize(action.payload, [statementSchema])
      return {
        ...state,
        statements: {
          ...state.statements,
          ...normalized.entities.statements,
        }
      }
    }
  },
  [api.fetchMainSearchSuggestions.response]: {
    next: (state, action) => {
      const normalized = normalize(action.payload, [statementSchema])
      return {
        ...state,
        statements: {
          ...state.statements,
          ...normalized.entities.statements,
        }
      }
    }
  }
}, {
  statements: {},
  statementCompounds: {},
  justifications: {},
  justificationsByRootStatementId: {},
  citationReferences: {},
  votes: {}
})
