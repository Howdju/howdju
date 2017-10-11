import assign from 'lodash/assign'
import assignWith from 'lodash/assignWith'
import clone from 'lodash/clone'
import cloneDeep from 'lodash/cloneDeep'
import concat from 'lodash/concat'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import get from 'lodash/get'
import has from 'lodash/has'
import isArray from 'lodash/isArray'
import isNumber from 'lodash/isNumber'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'
import pickBy from 'lodash/pickBy'
import reject from 'lodash/reject'
import some from 'lodash/some'
import union from 'lodash/union'
import values from 'lodash/values'
import without from 'lodash/without'
import {combineActions, handleActions} from "redux-actions"

import {
  isTruthy,
  httpStatusCodes,
} from 'howdju-common'

import {
  isCounter,
  JustificationTargetType,
} from 'howdju-common'
import {api} from '../actions'


export default handleActions({
  [combineActions(
    api.fetchStatement.response,
    api.fetchStatements.response,
    api.fetchRecentStatements.response,
    api.fetchRecentWrits.response,
    api.fetchRecentWritQuotes.response,
    api.fetchStatementJustifications.response,
    api.fetchFeaturedPerspectives.response,
    api.fetchJustificationsSearch.response,
    api.fetchRecentJustifications.response,
    api.fetchWritQuote.response,
    api.createStatement.response,
    api.updateStatement.response,
    api.updateWritQuote.response,
    api.fetchMainSearchSuggestions.response,
    api.fetchStatementTextSuggestions.response,
    api.fetchWritTitleSuggestions.response,
    api.fetchMainSearchResults.response,
    api.fetchTagNameSuggestions.response,
    api.tagStatement.response,
    api.antiTagStatement.response,
    api.fetchTag.response,
    api.fetchTaggedStatements.response,
  )]: {
    next: (state, action) => {
      const updates = map([
        ['perspectives'],
        ['statements', stubSkippingCustomizer('text')],
        ['statementCompounds'],
        ['justifications', justificationsCustomizer()],
        ['justificationVotes'],
        ['writQuotes', stubSkippingCustomizer('quoteText')],
        ['writs', stubSkippingCustomizer('title')],
        ['sourceExcerptParaphrases'],
        ['justificationBasisCompounds'],
        ['tags'],
        ['statementTagVotes'],
      ], ([entitiesKey, customizer]) => createEntityUpdate(state, action.payload.entities, entitiesKey, customizer))
      const nonEmptyUpdates = filter(updates, u => isTruthy(u))

      if (action.payload.entities.justifications) {
        const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)
        nonEmptyUpdates.push({justificationsByRootStatementId: mergeWith(
          {},
          state.justificationsByRootStatementId,
          justificationsByRootStatementId,
          unionArraysDistinctIdsCustomizer
        )})
      }

      if (nonEmptyUpdates.length > 0) {
        const newState = {...state}
        forEach(nonEmptyUpdates, update => {
          assign(newState, update)
        })
        return newState
      }
      return state
    }
  },
  [api.fetchStatementJustifications.response]: {
    throw: (state, action) => {
      // If a statement is not found (e.g., another user deleted it), then remove it.
      if (action.httpStatusCode === httpStatusCodes.NOT_FOUND) {
        return {
          ...state,
          statements: pickBy(state.statements, (s, id) => id !== action.meta.statementId)
        }
      }
      return state
    }
  },
  [api.deleteStatement.response]: {
    next: (state, action) => ({
      ...state,
      statements: pickBy(state.statements, (s, id) => id !== action.meta.requestPayload.statement.id )
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
      justificationsByRootStatementId[deletedJustification.rootStatement.id] =
        filter(justificationsByRootStatementId[deletedJustification.rootStatement.id], id => id !== deletedJustification.id)

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

  [combineActions(
    api.verifyJustification,
    api.disverifyJustification
  )]: (state, action) => {
    // Optimistically apply vote
    const vote = action.payload.justificationVote
    const {justificationId} = vote
    const currJustification = state.justifications[justificationId]
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
    // Optimistically remove vote
    const {
      justificationId,
    } = action.payload.justificationVote
    const currJustification = state.justifications[justificationId]
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
      // Apply the returned vote
      const vote = action.payload.entities.justificationVotes[action.payload.result.justificationVote]
      const currJustification = state.justifications[vote.justificationId]
      const justification = {...currJustification, vote}
      return {
        ...state,
        justifications: {...state.justifications, [justification.id]: justification},
        justificationVotes: {...state.justificationVotes, ...action.payload.entities.justificationVotes},
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
        justificationVote: {
          justificationId
        },
        previousJustificationVote,
      } = action.meta.requestPayload
      const currJustification = state.justifications[justificationId]
      const justification = merge({}, currJustification, {vote: previousJustificationVote})
      return {
        ...state,
        justifications: merge({}, state.justifications, {[justificationId]: justification}),
      }
    }
  },

  [combineActions(
    api.tagStatement,
    api.antiTagStatement,
  )]: optimisticStatementTagVote,
  [combineActions(
    api.unTagStatement,
  )]: optimisticStatementTagUnvote,
  [combineActions(
    api.tagStatement.response,
    api.antiTagStatement.response,
  )]: {
    next: replaceOptimisticStatementTagVote
  },
  [combineActions(
    api.tagStatement.response,
    api.antiTagStatement.response,
    api.unTagStatement.response,
  )]: {
    throw: revertOptimisticStatementTagVote
  },
}, {
  statements: {},
  statementCompounds: {},
  writs: {},
  writQuotes: {},
  justificationVotes: {},
  justifications: {},
  justificationsByRootStatementId: {},
  perspectives: {},
  tags: {},
})

export function unionArraysDistinctIdsCustomizer(destVal, srcVal) {
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

export function indexRootJustificationsByRootStatementId(justificationsById) {
  const justifications = values(justificationsById)
  const rootJustifications = filter(justifications, j =>
    // TODO do we need a more thorough approach to ensuring that only fully entities are present?
    // I'd like to send/receive them as stubs, and denormalize them somewhere standard
    // Some justifications that come back are stubs and will lack relations like .target
    j.target &&
    j.target.type === JustificationTargetType.STATEMENT &&
    j.target.entity.id === j.rootStatement
  )
  let rootJustificationsByRootStatementId = groupBy(rootJustifications, j => j.rootStatement)
  rootJustificationsByRootStatementId = mapValues(rootJustificationsByRootStatementId, justifications => map(justifications, j => j.id))
  // for (let statementId of Object.keys(justificationsByRootStatementId)) {
  //   justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => j.id)
  //   // justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => normalize(j, justificationSchema).result)
  // }
  return rootJustificationsByRootStatementId
}

function defaultCustomizer() {
  return undefined
}

/** Identifies non-stubs (objects that have more than the ID) by testing for the presence of a property */
function stubSkippingCustomizer(testPropertyName) {
  return  (objValue, srcValue, key, object, source) => {
    if (has(srcValue, testPropertyName)) {
      return srcValue
    }
    return objValue
  }
}

function justificationsCustomizer(objValue, srcValue, key, object, source) {
  // Don't override a value with one that is missing the relational information
  if (
    has(objValue, 'target.type') &&
    has(objValue, 'target.entity.id') &&
    (
      !has(srcValue, 'target.type') ||
      !has(srcValue, 'target.entity.id')
    )
  ) {
    return objValue
  }
  return srcValue
}

function createEntityUpdate(state, payloadEntities, key, customizer) {
  if (has(payloadEntities, key)) {
    return {[key]: assignWith({}, state[key], payloadEntities[key], customizer || defaultCustomizer)}
  }
  return null
}

function optimisticStatementTagVote(state, action) {
  const {
    statementTagVote: optimisticStatementTagVote,
    prevStatementTagVote
  } = action.payload

  const statementId = optimisticStatementTagVote.statement.id
  const statement = state.statements[statementId]

  const optimisticStatementTagVotes = concat(
    reject(statement.statementTagVotes, vote =>
      vote === prevStatementTagVote ||
      vote === get(prevStatementTagVote, 'id')
    ),
    [optimisticStatementTagVote]
  )

  const optimisticTag = optimisticStatementTagVote.tag
  const isAlreadyTagged = some(statement.tags, tagId =>
    tagId === optimisticTag.id ||
    state.tags[tagId].name === optimisticTag.name
  )
  const optimisticTags = isAlreadyTagged ?
    statement.tags :
    concat(statement.tags,  optimisticStatementTagVote.tag)

  const optimisticStatement = {
    ...statement,
    statementTagVotes: optimisticStatementTagVotes,
    tags: optimisticTags,
  }

  return {
    ...state,
    statements: {
      ...state.statements,
      [statementId]: optimisticStatement,
    },
  }
}

function optimisticStatementTagUnvote(state, action) {
  const {
    prevStatementTagVote,
  } = action.payload
  const {
    statement: {id: statementId}
  } = prevStatementTagVote
  const statement = state.statements[statementId]

  const optimisticStatementTagVotes = reject(statement.statementTagVotes, stv =>
    stv === prevStatementTagVote ||
    stv === prevStatementTagVote.id
  )
  const optimisticStatement = {
    ...statement,
    statementTagVotes: optimisticStatementTagVotes
  }

  return {
    ...state,
    statements: {
      ...state.statements,
      [statementId]: optimisticStatement,
    },
  }
}

function replaceOptimisticStatementTagVote(state, action) {
  const {
    statementTagVote: optimisticStatementTagVote,
  } = action.meta.requestPayload
  const statementTagVote = action.payload.entities.statementTagVotes[action.payload.result.statementTagVote]

  const optimisticStatement = state.statements[statementTagVote.statement.id]
  const statementTagVotes = map(optimisticStatement.statementTagVotes, stv =>
    stv === optimisticStatementTagVote ? statementTagVote.id : stv
  )
  const tags = map(optimisticStatement.tags, tag =>
    // statementTagVote.tag will actually be the ID
    tag === optimisticStatementTagVote.tag ? statementTagVote.tag : tag
  )
  const statement = {...optimisticStatement, statementTagVotes, tags}

  return {
    ...state,
    statements: {
      ...state.statements,
      [statement.id]: statement,
    },
  }
}

function revertOptimisticStatementTagVote(state, action) {
  const {
    statementTagVote: optimisticStatementTagVote,
    prevStatementTagVote,
  } = action.meta.requestPayload
  // untagging has no optimistic vote, only a previous vote
  const statementId = get(optimisticStatementTagVote, 'statement.id', get(prevStatementTagVote, 'statement.id'))
  if (!statementId) {
    // This shouldn't ever happen...
    return
  }

  const optimisticStatement = state.statements[statementId]
  const revertedStatementTagVotes = without(optimisticStatement.statementTagVotes, optimisticStatementTagVote)
  if (prevStatementTagVote) {
    revertedStatementTagVotes.push(prevStatementTagVote.id)
  }
  // Most of the normalized tags will be IDs.  But if it was added optimistically, it will be an object, and it will
  //  be equal to the tag of the optimistic vote
  const revertedTags = optimisticStatementTagVote ?
    reject(optimisticStatement.tags, tagId => tagId === optimisticStatementTagVote.tag) :
    optimisticStatement.tags

  const revertedStatement = {
    ...optimisticStatement,
    statementTagVotes: revertedStatementTagVotes,
    tags: revertedTags
  }

  return {
    ...state,
    statements: {
      ...state.statements,
      [statementId]: revertedStatement,
    },
  }
}