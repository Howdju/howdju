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
import {
  isCounter,
  JustificationTargetType,
  VotePolarity,
  VoteTargetType
} from '../models'

import {
  FETCH_STATEMENTS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_FAILURE,
  VERIFY_JUSTIFICATION, VERIFY_JUSTIFICATION_SUCCESS, VERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION_FAILURE,
  DISVERIFY_JUSTIFICATION_FAILURE, UN_DISVERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION,
  UN_DISVERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION_SUCCESS, DELETE_STATEMENT_SUCCESS,
  DELETE_JUSTIFICATION_SUCCESS,
  FETCH_STATEMENT_SUGGESTIONS_SUCCESS,
  CREATE_JUSTIFICATION_SUCCESS, FETCH_STATEMENT_SUCCESS,
  UPDATE_STATEMENT_SUCCESS, CREATE_STATEMENT_JUSTIFICATION_SUCCESS,
  API_RESOURCE_ACTIONS,
  UPDATE_CITATION_REFERENCE, SUCCESS, FAILURE, CREATE_STATEMENT_SUCCESS,
} from '../actions'

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
          // TODO do we need a more thorough approach to ensuring that only fully entities are present? I'd like to send/receive them as stubs, and denormalize them somewhere standard
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

export default (state = {
  statements: {},
  justifications: {},
  justificationsByRootStatementId: {},
  citationReferences: {},
  votes: {}
}, action) => {

  switch (action.type) {
    case FETCH_STATEMENTS_SUCCESS:
      return {...state, statements: merge(state.statements, action.payload.entities.statements)}

    case FETCH_STATEMENT_SUCCESS:
      return {...state, statements: merge(state.statements, action.payload.entities.statements)}

    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)
      return {
        ...state,
        statements: merge({}, state.statements, action.payload.entities.statements),
        justifications: merge({}, state.justifications, action.payload.entities.justifications),
        votes: merge({}, state.votes, action.payload.entities.votes),
        justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, unionArraysDistinctIdsCustomizer),
        citationReferences: merge({}, state.citationReferences, action.payload.entities.citationReferences),
      }

    case CREATE_STATEMENT_SUCCESS:
    case CREATE_STATEMENT_JUSTIFICATION_SUCCESS: {
      return {
        ...state,
        statements: {...state.statements, ...action.payload.entities.statements},
        justifications: {...state.justifications, ...action.payload.entities.justifications},
      }
    }
    case UPDATE_STATEMENT_SUCCESS: {
      return {
        ...state,
        statements: {...state.statements, ...action.payload.entities.statements}
      }
    }
    case DELETE_STATEMENT_SUCCESS: {
      return {
        ...state,
        statements: pickBy(state.statements, (s, id) => +id !== action.meta.deletedEntity.id )
      }
    }
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      return {
        ...state,
        statements: pickBy(state.statements, (s, id) => +id !== action.meta.statementId)
      }

    case CREATE_JUSTIFICATION_SUCCESS: {
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
      // return {
      //   ...state,
      //   statements: merge({}, state.statements, action.payload.entities.statements),
      //   justifications: merge({}, state.justifications, action.payload.entities.justifications),
      //   justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, mergeArraysCustomizer)
      // }
    }
    case DELETE_JUSTIFICATION_SUCCESS: {
      const deletedJustification = action.meta.deletedEntity
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

    case API_RESOURCE_ACTIONS[UPDATE_CITATION_REFERENCE][SUCCESS]: {
      return {
        ...state,
        citationReferences: {
          ...state.citationReferences,
          ...action.payload.entities.citationReferences
        }
      }
    }

    case VERIFY_JUSTIFICATION:
    case DISVERIFY_JUSTIFICATION: {
      const currJustification = state.justifications[action.payload.target.id]
      const targetType = VoteTargetType.JUSTIFICATION
      const targetId = currJustification.id
      const polarity = action.type === VERIFY_JUSTIFICATION ? VotePolarity.POSITIVE : VotePolarity.NEGATIVE
      const justification = merge({}, currJustification, {vote: {targetType, targetId, polarity}})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[justification.id]: justification}),
      }
    }
    case UN_VERIFY_JUSTIFICATION:
    case UN_DISVERIFY_JUSTIFICATION: {
      const currJustification = state.justifications[action.payload.target.id]
      const justification = merge({}, currJustification, {vote: null})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[justification.id]: justification}),
      }
    }
    case VERIFY_JUSTIFICATION_SUCCESS:
    case DISVERIFY_JUSTIFICATION_SUCCESS: {
      const currJustification = state.justifications[action.meta.originalTarget.id]
      const vote = action.payload.entities.votes[action.payload.result]
      const justification = merge({}, currJustification, {vote})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[justification.id]: justification}),
        votes: merge({}, state.votes, action.payload.entities.votes),
      }
    }
    case VERIFY_JUSTIFICATION_FAILURE:
    case UN_VERIFY_JUSTIFICATION_FAILURE:
    case DISVERIFY_JUSTIFICATION_FAILURE:
    case UN_DISVERIFY_JUSTIFICATION_FAILURE: {
      const prevJustification = action.meta.originalTarget
      const currJustification = state.justifications[prevJustification.id]
      const justification = merge({}, currJustification, {vote: prevJustification.vote})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[justification.id]: justification}),
      }
    }

    case FETCH_STATEMENT_SUGGESTIONS_SUCCESS:
      return {
        ...state,
        statements: {
          ...state.statements,
          ...action.payload.entities.statements,
        }
      }
  }

  return state
}