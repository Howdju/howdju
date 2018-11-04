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
import {normalize} from 'normalizr'
import {combineActions, handleActions} from "redux-actions"

import {
  httpStatusCodes,
  isCounter,
  isTruthy,
  JustificationRootTargetType,
  JustificationTargetType,
} from 'howdju-common'

import {api} from '../actions'


const defaultState = {
  propositions: {},
  propositionCompounds: {},
  writs: {},
  writQuotes: {},
  justificationVotes: {},
  justifications: {},
  trunkJustificationsByRootPropositionId: {},
  perspectives: {},
  persorgs: {},
  tags: {},
  users: {},
}

export default handleActions({
  [combineActions(
    api.fetchProposition.response,
    api.fetchPropositions.response,
    api.fetchRecentPropositions.response,
    api.fetchRecentWrits.response,
    api.fetchRecentWritQuotes.response,
    api.fetchPropositionJustifications.response,
    api.fetchFeaturedPerspectives.response,
    api.fetchJustificationsSearch.response,
    api.fetchRecentJustifications.response,
    api.fetchWritQuote.response,
    api.createProposition.response,
    api.updateProposition.response,
    api.createStatement.response,
    api.updateWritQuote.response,
    api.fetchMainSearchSuggestions.response,
    api.fetchPropositionTextSuggestions.response,
    api.fetchPersorgNameSuggestions.response,
    api.fetchWritTitleSuggestions.response,
    api.fetchMainSearchResults.response,
    api.fetchTagNameSuggestions.response,
    api.tagProposition.response,
    api.antiTagProposition.response,
    api.fetchTag.response,
    api.fetchTaggedPropositions.response,
    api.fetchPersorg.response,
  )]: {
    next: (state, action) => {
      const {entities} = normalize(action.payload, action.meta.normalizationSchema)

      const updates = map([
        ['justificationBasisCompounds'],
        ['justifications', justificationsCustomizer()],
        ['justificationVotes'],
        ['persorgs'],
        ['perspectives'],
        ['propositionCompounds'],
        ['propositions', entityAssignWithCustomizer],
        ['propositionTagVotes'],
        ['sourceExcerptParaphrases'],
        ['statements', entityAssignWithCustomizer],
        ['tags'],
        ['users'],
        ['writQuotes', stubSkippingCustomizer('quoteText')],
        ['writs', stubSkippingCustomizer('title')],
      ], ([entitiesKey, customizer]) => createEntityUpdate(state, entities, entitiesKey, customizer))
      const nonEmptyUpdates = filter(updates, u => isTruthy(u))

      if (entities.justifications) {
        // for (const justification of entities.justifications) {
        //   let target
        //   switch (justification.target.type) {
        //     case JustificationTargetType.STATEMENT:
        //       target = state.statements[justification.target.id]
        //       break
        //     case JustificationTargetType.PROPOSITION:
        //       target = state.statements[justification.target.id]
        //       break
        //     case JustificationTargetType.JUSTIFICATION:
        //       target = state.statements[justification.target.id]
        //       break
        //     default:
        //       throw newExhaustedEnumError('JustificationTargetType', justification.target.type)
        //   }
        //   // TODO need to do this to updated state, not in-place
        //   if (target.justifications.indexOf(justification.id) < 0) {
        //     target.justifications.push(justification.id)
        //   }
        //
        //   let rootTarget
        //   switch (justification.rootTargetType) {
        //     case JustificationRootTargetType.STATEMENT:
        //       rootTarget = state.statements[justification.rootTarget.id]
        //       break
        //     case JustificationRootTargetType.PROPOSITION:
        //       target = state.statements[justification.rootTarget.id]
        //       break
        //     default:
        //       throw newExhaustedEnumError('JustificationRootTargetType', justification.rootTarget.type)
        //   }
        //   // TODO need to do this to updated state, not in-place
        //   if (rootTarget.leafJustifications.indexOf(justification.id) < 0) {
        //     rootTarget.leafJustifications.push(justification.id)
        //   }
        // }

        const trunkJustificationsByRootPropositionId = indexTrunkJustificationsByRootPropositionId(entities.justifications)
        nonEmptyUpdates.push({
          trunkJustificationsByRootPropositionId: mergeWith(
            {},
            state.trunkJustificationsByRootPropositionId,
            trunkJustificationsByRootPropositionId,
            unionArraysDistinctIdsCustomizer
          )
        })
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
  [api.fetchPropositionJustifications.response]: {
    throw: (state, action) => {
      // If a proposition is not found (e.g., another user deleted it), then remove it.
      if (action.httpStatusCode === httpStatusCodes.NOT_FOUND) {
        return {
          ...state,
          propositions: pickBy(state.propositions, (s, id) => id !== action.meta.propositionId)
        }
      }
      return state
    }
  },
  [api.deleteProposition.response]: {
    next: (state, action) => ({
      ...state,
      propositions: pickBy(state.propositions, (s, id) => id !== action.meta.requestPayload.proposition.id )
    })
  },
  [api.createJustification.response]: {
    next: (state, action) => {
      const {result, entities} = normalize(action.payload, action.meta.normalizationSchema)

      const trunkJustificationsByRootPropositionId = indexTrunkJustificationsByRootPropositionId(entities.justifications)

      // if counter, add to counter justifications
      const justificationId = result.justification
      const justification = entities.justifications[justificationId]
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
        entities,
        counteredJustifications,
        {trunkJustificationsByRootPropositionId},
        unionArraysDistinctIdsCustomizer,
      )
    }
  },
  [api.deleteJustification.response]: {
    next: (state, action) => {
      const deletedJustification = action.meta.requestPayload.justification
      const trunkJustificationsByRootPropositionId = cloneDeep(state.trunkJustificationsByRootPropositionId)
      trunkJustificationsByRootPropositionId[deletedJustification.rootTarget.id] =
        filter(trunkJustificationsByRootPropositionId[deletedJustification.rootTarget.id], id => id !== deletedJustification.id)

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
        trunkJustificationsByRootPropositionId
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
      const {result, entities} = normalize(action.payload, action.meta.normalizationSchema)
      // Apply the returned vote
      const vote = entities.justificationVotes[result.justificationVote]
      const currJustification = state.justifications[vote.justificationId]
      const justification = {...currJustification, vote}
      return {
        ...state,
        justifications: {...state.justifications, [justification.id]: justification},
        justificationVotes: {...state.justificationVotes, ...entities.justificationVotes},
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
    api.tagProposition,
    api.antiTagProposition,
  )]: optimisticPropositionTagVote,
  [combineActions(
    api.unTagProposition,
  )]: optimisticPropositionTagUnvote,
  [combineActions(
    api.tagProposition.response,
    api.antiTagProposition.response,
  )]: {
    next: replaceOptimisticPropositionTagVote
  },
  [combineActions(
    api.tagProposition.response,
    api.antiTagProposition.response,
    api.unTagProposition.response,
  )]: {
    throw: revertOptimisticPropositionTagVote
  },
}, defaultState)

export function unionArraysDistinctIdsCustomizer(destVal, srcVal, key, object, source, stack) {
  if (isArray(destVal) && isArray(srcVal)) {
    // For values that have IDs, overwrite dest values
    const seenDestIdIndices = {}
    const filteredDestVals = []
    forEach(destVal, val => {
      const id = val.id || val.entity
      if (val && id) {
        if (!isNumber(seenDestIdIndices[id])) {
          filteredDestVals.push(val)
          seenDestIdIndices[id] = filteredDestVals.length - 1
        } else {
          filteredDestVals[seenDestIdIndices[id]] = val
        }
      } else {
        // If the value lacks an ID, just merge it
        filteredDestVals.push(val)
      }
    })

    const seenSrcIdIndices = {}
    const filteredSrcVals = []
    forEach(srcVal, val => {
      const id = val.id || val.entity
      if (val && id && isNumber(seenDestIdIndices[id])) {
        // Overwrite dest items having the same ID
        filteredDestVals[seenDestIdIndices[id]] = val
      } else if (val && id && isNumber(seenSrcIdIndices[id])) {
        filteredSrcVals[seenSrcIdIndices[id]] = val
      } else if (val && id) {
        filteredSrcVals.push(val)
        seenSrcIdIndices[id] = filteredSrcVals.length - 1
      } else {
        // If the value lacks an ID, just merge it
        filteredSrcVals.push(val)
      }
    })
    return union(filteredDestVals, filteredSrcVals)
  }
  return undefined // tells lodash to use its default method
}

export function indexTrunkJustificationsByRootPropositionId(justificationsById) {
  const justifications = values(justificationsById)
  const rootJustifications = filter(justifications, j =>
    // TODO do we need a more thorough approach to ensuring that only fully entities are present?
    // I'd like to send/receive them as stubs, and denormalize them somewhere standard
    // Some justifications that come back are stubs and will lack relations like .target
    j.target &&
    j.target.type === JustificationTargetType.PROPOSITION &&
    j.rootTargetType === JustificationRootTargetType.PROPOSITION &&
    j.target.entity.id === j.rootTarget.id
  )
  let trunkJustificationsByRootPropositionId = groupBy(rootJustifications, j => j.rootTarget.id)
  return mapValues(trunkJustificationsByRootPropositionId, justifications => map(justifications, j => j.id))
}

/** Returning undefined from a customizer to assignWith invokes its default behavior */
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

/** Responses from the API may not contain all entity properties.  Only update an entity in the store with
 * values that are defined. (Don't overwrite properties that aren't present on the new value)
 */
function entityAssignWithCustomizer(oldEntity, newEntity, key, object, source) {
  // If either the new or old entity is missing, then updates don't make sense
  if (!oldEntity || !newEntity) {
    return newEntity
  }

  let updatedEntity = oldEntity
  forEach(newEntity, (prop, name) => {
    if (prop !== oldEntity[name]) {
      // Copy-on-write
      if (updatedEntity === oldEntity) {
        updatedEntity = {...oldEntity}
      }
      updatedEntity[name] = prop
    }
  })
  return updatedEntity
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

function optimisticPropositionTagVote(state, action) {
  const {
    propositionTagVote: optimisticPropositionTagVote,
    prevPropositionTagVote
  } = action.payload

  const propositionId = optimisticPropositionTagVote.proposition.id
  const proposition = state.propositions[propositionId]

  const optimisticPropositionTagVotes = concat(
    reject(proposition.propositionTagVotes, vote =>
      vote === prevPropositionTagVote ||
      vote === get(prevPropositionTagVote, 'id')
    ),
    [optimisticPropositionTagVote]
  )

  const optimisticTag = optimisticPropositionTagVote.tag
  const isAlreadyTagged = some(proposition.tags, tagId =>
    tagId === optimisticTag.id ||
    get(state.tags[tagId], 'name') === optimisticTag.name
  )
  const optimisticTags = isAlreadyTagged ?
    proposition.tags :
    concat(proposition.tags,  optimisticPropositionTagVote.tag)

  const optimisticProposition = {
    ...proposition,
    propositionTagVotes: optimisticPropositionTagVotes,
    tags: optimisticTags,
  }

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [propositionId]: optimisticProposition,
    },
  }
}

function optimisticPropositionTagUnvote(state, action) {
  const {
    prevPropositionTagVote,
  } = action.payload
  const {
    proposition: {id: propositionId}
  } = prevPropositionTagVote
  const proposition = state.propositions[propositionId]

  const optimisticPropositionTagVotes = reject(proposition.propositionTagVotes, stv =>
    stv === prevPropositionTagVote ||
    stv === prevPropositionTagVote.id
  )
  const optimisticProposition = {
    ...proposition,
    propositionTagVotes: optimisticPropositionTagVotes
  }

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [propositionId]: optimisticProposition,
    },
  }
}

function replaceOptimisticPropositionTagVote(state, action) {
  const {result, entities} = normalize(action.payload, action.meta.normalizationSchema)
  const {
    propositionTagVote: optimisticPropositionTagVote,
  } = action.meta.requestPayload
  const propositionTagVote = entities.propositionTagVotes[result.propositionTagVote]

  const optimisticProposition = state.propositions[propositionTagVote.proposition.id]
  const propositionTagVotes = map(optimisticProposition.propositionTagVotes, stv =>
    stv === optimisticPropositionTagVote ? propositionTagVote.id : stv
  )
  const tags = map(optimisticProposition.tags, tag =>
    // propositionTagVote.tag will actually be the ID
    tag === optimisticPropositionTagVote.tag ? propositionTagVote.tag : tag
  )
  const proposition = {...optimisticProposition, propositionTagVotes, tags}

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [proposition.id]: proposition,
    },
  }
}

function revertOptimisticPropositionTagVote(state, action) {
  const {
    propositionTagVote: optimisticPropositionTagVote,
    prevPropositionTagVote,
  } = action.meta.requestPayload
  // untagging has no optimistic vote, only a previous vote
  const propositionId = get(optimisticPropositionTagVote, 'proposition.id', get(prevPropositionTagVote, 'proposition.id'))
  if (!propositionId) {
    // This shouldn't ever happen...
    return
  }

  const optimisticProposition = state.propositions[propositionId]
  const revertedPropositionTagVotes = without(optimisticProposition.propositionTagVotes, optimisticPropositionTagVote)
  if (prevPropositionTagVote && prevPropositionTagVote.id) {
    revertedPropositionTagVotes.push(prevPropositionTagVote.id)
  }
  // Most of the normalized tags will be IDs.  But if it was added optimistically, it will be an object, and it will
  //  be equal to the tag of the optimistic vote
  const revertedTags = optimisticPropositionTagVote ?
    reject(optimisticProposition.tags, tagId => tagId === optimisticPropositionTagVote.tag) :
    optimisticProposition.tags

  const revertedProposition = {
    ...optimisticProposition,
    propositionTagVotes: revertedPropositionTagVotes,
    tags: revertedTags
  }

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [propositionId]: revertedProposition,
    },
  }
}