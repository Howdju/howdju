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
import toNumber from 'lodash/toNumber'
import {combineActions, handleActions} from "redux-actions";

import {
  isCounter,
  JustificationTargetType,
  VotePolarity,
  VoteTargetType
} from '../models'
import {api, str} from '../actions'
import * as httpStatuses from "../httpStatuses";
import {normalize} from "normalizr";
import {statementSchema} from "../schemas";

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
  )]: {
    next: (state, action) => ({...state, statements: {...state.statements, ...action.payload.entities.statements}})
  },
  [api.fetchStatementJustifications.response]: {
    next: (state, action) => {
      const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)
      return {
        ...state,
        statements: {...state.statements, ...action.payload.entities.statements},
        justifications: {...state.justifications, ...action.payload.entities.justifications},
        votes: {...state.votes, ...action.payload.entities.votes},
        justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, unionArraysDistinctIdsCustomizer),
        citationReferences: {...state.citationReferences, ...action.payload.entities.citationReferences},
      }
    },
    throw: (state, action) => {
      // If a statement is not found (another user deleted it), then remove it.
      if (action.status === httpStatuses.NOT_FOUND) {
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
  [combineActions(
      api.createStatement.response,
      api.createStatementJustification.response
  )]: {
    next: (state, action) => ({
      ...state,
      statements: {...state.statements, ...action.payload.entities.statements},
      justifications: {...state.justifications, ...action.payload.entities.justifications},
      citationReferences: {...state.citationReferences, ...action.payload.entities.citationReferences},
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
        const counteredJustificationId = toNumber(deletedJustification.target.entity.id)
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
    const {
      targetId,
      targetType,
      polarity
    } = action.payload
    const currJustification = state.justifications[targetId]
    const justification = merge({}, currJustification, {vote: {targetType, targetId, polarity}})
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
    } = action.payload
    const currJustification = state.justifications[targetId]
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
      const vote = action.payload.entities.votes[action.payload.result]
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
      const prevJustification = action.meta.requestPayload.justification
      const currJustification = state.justifications[prevJustification.id]
      const justification = merge({}, currJustification, {vote: prevJustification.vote})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[justification.id]: justification}),
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
  justifications: {},
  justificationsByRootStatementId: {},
  citationReferences: {},
  votes: {}
})
