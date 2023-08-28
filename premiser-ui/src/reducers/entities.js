import {
  set,
  assign,
  concat,
  filter,
  forEach,
  get,
  has,
  isArray,
  isNumber,
  clone,
  map,
  merge,
  mergeWith,
  pickBy,
  reject,
  some,
  union,
  without,
  reduce,
  isPlainObject,
} from "lodash";
import { normalize } from "normalizr";
import { combineActions, handleActions } from "redux-actions";
import deepMerge from "deepmerge";

import {
  httpStatusCodes,
  idEqual,
  isTruthy,
  JustificationTargetTypes,
  newExhaustedEnumError,
} from "howdju-common";

import { api } from "../actions";
import { logger } from "@/logger";

const defaultState = {
  appearances: {},
  contextTrailItems: {},
  justifications: {},
  justificationVotes: {},
  mediaExcerpts: {},
  persorgs: {},
  propositions: {},
  propositionCompounds: {},
  sources: {},
  statements: {},
  tags: {},
  urlLocators: {},
  users: {},
  writs: {},
  writQuotes: {},
};

export default handleActions(
  {
    [combineActions(
      api.antiTagProposition.response,
      api.createAppearance.response,
      api.createProposition.response,
      api.createStatement.response,
      api.fetchContextTrail.response,
      api.fetchFactCheck.response,
      api.fetchIndirectPropositionStatements.response,
      api.fetchJustificationsSearch.response,
      api.fetchMainSearchResults.response,
      api.fetchMainSearchSuggestions.response,
      api.fetchMediaExcerpt.response,
      api.fetchPersorg.response,
      api.fetchPersorgNameSuggestions.response,
      api.fetchProposition.response,
      api.tagProposition.response,
      api.fetchAppearance.response,
      api.fetchPropositions.response,
      api.fetchPropositionAppearances.response,
      api.fetchPropositionCompounds.response,
      api.fetchPropositionRootJustificationTarget.response,
      api.fetchPropositionTextSuggestions.response,
      api.fetchRecentAppearances.response,
      api.fetchRecentJustifications.response,
      api.fetchRecentPropositions.response,
      api.fetchRecentWrits.response,
      api.fetchRecentWritQuotes.response,
      api.fetchRecentMediaExcerpts.response,
      api.fetchRootPropositionStatements.response,
      api.fetchSentenceStatements.response,
      api.fetchSource.response,
      api.fetchSourceMediaExcerpts.response,
      api.fetchMoreSourceMediaExcerpts.response,
      api.fetchSourceDescriptionSuggestions.response,
      api.fetchSpeakerStatements.response,
      api.fetchSpeakerMediaExcerpts.response,
      api.fetchStatementRootJustificationTarget.response,
      api.fetchTag.response,
      api.fetchTagNameSuggestions.response,
      api.fetchTaggedPropositions.response,
      api.fetchWritQuote.response,
      api.fetchWritTitleSuggestions.response,
      api.updatePersorg.response,
      api.updateSource.response,
      api.updateProposition.response,
      api.updateWritQuote.response,

      api.confirmAppearance.response,
      api.unconfirmAppearance.response,
      api.disconfirmAppearance.response,
      api.undisconfirmAppearance.response
    )]: {
      next: (state, action) => {
        const { entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );

        const updates = map(
          [
            ["appearances"],
            ["contextTrailItems"],
            ["justifications"],
            ["justificationVotes"],
            ["mediaExcerpts"],
            ["persorgs"],
            ["propositionCompounds"],
            ["propositions"],
            ["propositionTagVotes"],
            ["sources"],
            ["sourceExcerptParaphrases"],
            ["statements"],
            ["tags"],
            ["urlLocators"],
            ["users"],
            ["urls"],
            ["writQuotes"],
            ["writs"],
          ],
          ([entitiesKey]) => createEntityUpdate(state, entities, entitiesKey)
        );
        const nonEmptyUpdates = filter(updates, (u) => isTruthy(u));

        if (nonEmptyUpdates.length > 0) {
          const newState = { ...state };
          forEach(nonEmptyUpdates, (update) => {
            assign(newState, update);
          });
          return newState;
        }
        return state;
      },
    },
    [api.fetchPropositionRootJustificationTarget.response]: {
      throw: (state, action) => {
        // If a proposition is not found (e.g., another user deleted it), then remove it.
        if (action.httpStatusCode === httpStatusCodes.NOT_FOUND) {
          const { rootTargetId } = action.meta.requestMeta;
          const update = {
            propositions: pickBy(
              state.propositions,
              (s, id) => id !== rootTargetId
            ),
          };
          return {
            ...state,
            ...update,
          };
        }
        return state;
      },
    },
    [api.fetchStatementRootJustificationTarget.response]: {
      throw: (state, action) => {
        // If a proposition is not found (e.g., another user deleted it), then remove it.
        if (action.httpStatusCode === httpStatusCodes.NOT_FOUND) {
          const { rootTargetId } = action.meta.requestMeta;
          const update = {
            statements: pickBy(
              state.statements,
              (s, id) => id !== rootTargetId
            ),
          };
          return {
            ...state,
            ...update,
          };
        }
        return state;
      },
    },
    [api.deleteProposition.response]: {
      next: (state, action) => ({
        ...state,
        propositions: pickBy(
          state.propositions,
          (p, id) => id !== action.meta.requestMeta.propositionId
        ),
      }),
    },
    [api.createJustification.response]: {
      next: (state, action) => {
        const { entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        const targetUpdates = makeUpdatesAddingJustificationsToTargets(
          entities,
          state
        );
        return mergeWith(
          {},
          state,
          entities,
          targetUpdates,
          unionArraysDistinctIdsCustomizer
        );
      },
    },

    [api.createUrlLocators.response]: {
      next: (state, action) => {
        const { entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        const mediaExcerptUpdates = makeUpdatesAddingUrlLocatorsToMediaExcerpts(
          entities,
          state
        );
        const newState = mergeWith(
          {},
          state,
          entities,
          mediaExcerptUpdates,
          unionArraysDistinctIdsCustomizer
        );
        return newState;
      },
    },
    [api.deleteUrlLocator.response]: {
      next: (state, action) => {
        const { urlLocatorId, mediaExcerptId } = action.meta.requestMeta;
        return applyUpdates(
          state,
          removeEntityById("urlLocators", urlLocatorId),
          removeRelation(
            "mediaExcerpts",
            mediaExcerptId,
            "locators.urlLocators",
            urlLocatorId
          )
        );
      },
    },

    [api.createCounterJustification.response]: {
      next: (state, action) => {
        const { entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        const targetUpdates = makeUpdatesAddingJustificationsToTargets(
          entities,
          state
        );
        const result = mergeWith(
          {},
          state,
          entities,
          targetUpdates,
          unionArraysDistinctIdsCustomizer
        );
        return result;
      },
    },
    [api.deleteJustification.response]: {
      next: (state, action) => {
        const {
          justificationId,
          justificationTargetType,
          justificationTargetId,
        } = action.meta.requestMeta;
        const stateWithoutJustification = {
          ...state,
          justifications: pickBy(
            state.justifications,
            (j, id) => !idEqual(id, justificationId)
          ),
        };
        const targetUpdate = makeUpdateRemovingJustificationFromTarget(
          justificationId,
          justificationTargetType,
          justificationTargetId,
          stateWithoutJustification
        );
        return {
          ...state,
          ...targetUpdate,
        };
      },
    },

    [combineActions(api.verifyJustification, api.disverifyJustification)]: (
      state,
      action
    ) => {
      // Optimistically apply vote
      const vote = action.meta.justificationVote;
      const { justificationId } = vote;
      const currJustification = state.justifications[justificationId];
      const justification = merge({}, currJustification, { vote });
      return {
        ...state,
        justifications: {
          ...state.justifications,
          [justification.id]: justification,
        },
      };
    },
    [combineActions(api.unVerifyJustification, api.unDisverifyJustification)]: (
      state,
      action
    ) => {
      // Optimistically remove vote
      const { justificationId } = action.meta.justificationVote;
      const currJustification = state.justifications[justificationId];
      const justification = merge({}, currJustification, { vote: null });
      return {
        ...state,
        justifications: {
          ...state.justifications,
          [justification.id]: justification,
        },
      };
    },
    [combineActions(
      api.verifyJustification.response,
      api.disverifyJustification.response
    )]: {
      next: (state, action) => {
        const { result, entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        // Apply the returned vote
        const vote = entities.justificationVotes[result.justificationVote];
        const currJustification = state.justifications[vote.justificationId];
        const justification = { ...currJustification, vote };
        return {
          ...state,
          justifications: {
            ...state.justifications,
            [justification.id]: justification,
          },
          justificationVotes: {
            ...state.justificationVotes,
            ...entities.justificationVotes,
          },
        };
      },
    },
    [combineActions(
      api.verifyJustification.response,
      api.unVerifyJustification.response,
      api.disverifyJustification.response,
      api.unDisverifyJustification.response
    )]: {
      throw: (state, action) => {
        // Undo optimistic vote
        const { justificationId, previousJustificationVote } =
          action.meta.requestMeta;
        const currJustification = state.justifications[justificationId];
        const justification = merge({}, currJustification, {
          vote: previousJustificationVote,
        });
        return {
          ...state,
          justifications: merge({}, state.justifications, {
            [justificationId]: justification,
          }),
        };
      },
    },

    [combineActions(api.tagProposition, api.antiTagProposition)]:
      optimisticPropositionTagVote,
    [combineActions(api.unTagProposition)]: optimisticPropositionTagUnvote,
    [combineActions(
      api.tagProposition.response,
      api.antiTagProposition.response
    )]: {
      next: replaceOptimisticPropositionTagVote,
    },
    [combineActions(
      api.tagProposition.response,
      api.antiTagProposition.response,
      api.unTagProposition.response
    )]: {
      throw: revertOptimisticPropositionTagVote,
    },
  },
  defaultState
);

/**
 *  Iteratively applies updates to the state.
 *
 * If an updateMaker returns undefined or an empty object, it is ignored.
 *
 * @param {EntitiesState} state
 * @param  {(EntitiesState) => Partial<EntitiesState>} updateMakers - one or more functions that take the current state and return an update
 * @returns
 */
export function applyUpdates(state, ...updateMakers) {
  return reduce(
    updateMakers,
    (state, updateMaker) => {
      const update = updateMaker(state);
      if (!update || Object.keys(update).length === 0) {
        return state;
      }
      return merge({}, state, update);
    },
    state
  );
}

export function removeEntityById(entitiesKey, id) {
  return (state) => ({
    [entitiesKey]: pickBy(state[entitiesKey], (_e, eId) => !idEqual(eId, id)),
  });
}

/**
 * Remove a relation from an entity.
 *
 * @param entitiesKey the entity's state key
 * @param entityId the entity's ID
 * @param relationPath the path to the relation. This must point to an array of IDs.
 * @param relatedEntityId the ID of the related entity to remove
 */
export function removeRelation(
  entitiesKey,
  entityId,
  relationPath,
  relatedEntityId
) {
  return (state) => {
    const entity = state[entitiesKey][entityId];
    if (!entity) {
      logger.warn(`No ${entitiesKey} entity found for ID ${entityId}`);
      return state;
    }
    const relation = get(entity, relationPath);
    if (!relation) {
      logger.warn(
        `No relation found at path ${relationPath} for ${entitiesKey} entity with ID ${entityId}`
      );
      return state;
    }
    const newEntity = { ...entity };
    set(
      newEntity,
      relationPath,
      filter(relation, (r) => !idEqual(r, relatedEntityId))
    );
    return {
      [entitiesKey]: {
        [entityId]: newEntity,
      },
    };
  };
}

export function unionArraysDistinctIdsCustomizer(
  destVal,
  srcVal,
  _key,
  _object,
  _source,
  _stack
) {
  if (isArray(destVal) && isArray(srcVal)) {
    // For values that have IDs, overwrite dest values
    const seenDestIdIndices = {};
    const filteredDestVals = [];
    forEach(destVal, (val) => {
      const id = val.id || val.entity;
      if (val && id) {
        if (!isNumber(seenDestIdIndices[id])) {
          filteredDestVals.push(val);
          seenDestIdIndices[id] = filteredDestVals.length - 1;
        } else {
          filteredDestVals[seenDestIdIndices[id]] = val;
        }
      } else {
        // If the value lacks an ID, just merge it
        filteredDestVals.push(val);
      }
    });

    const seenSrcIdIndices = {};
    const filteredSrcVals = [];
    forEach(srcVal, (val) => {
      const id = val.id || val.entity;
      if (val && id && isNumber(seenDestIdIndices[id])) {
        // Overwrite dest items having the same ID
        filteredDestVals[seenDestIdIndices[id]] = val;
      } else if (val && id && isNumber(seenSrcIdIndices[id])) {
        filteredSrcVals[seenSrcIdIndices[id]] = val;
      } else if (val && id) {
        filteredSrcVals.push(val);
        seenSrcIdIndices[id] = filteredSrcVals.length - 1;
      } else {
        // If the value lacks an ID, just merge it
        filteredSrcVals.push(val);
      }
    });
    return union(filteredDestVals, filteredSrcVals);
  }
  return undefined; // tells lodash to use its default method
}

function makeUpdatesAddingUrlLocatorsToMediaExcerpts(entities, state) {
  const updates = {};
  forEach(entities.urlLocators, (urlLocator, id) => {
    const mediaExcerptId = urlLocator.mediaExcerptId;
    const mediaExcerpt = state.mediaExcerpts[mediaExcerptId];
    if (!mediaExcerpt) {
      return;
    }
    if (!updates.mediaExcerpts) {
      updates.mediaExcerpts = {};
    }
    updates.mediaExcerpts[mediaExcerptId] = {
      ...mediaExcerpt,
      locators: {
        ...mediaExcerpt.locators,
        urlLocators: union(mediaExcerpt.locators.urlLocators, [id]),
      },
    };
  });
  return updates;
}

export function makeUpdatesAddingJustificationsToTargets(entities, state) {
  const updates = {};
  forEach(entities.justifications, (justification, id) => {
    let entitiesKey, justificationsKey;
    const targetId = justification.target.entity.id;
    switch (justification.target.type) {
      case JustificationTargetTypes.PROPOSITION:
        entitiesKey = "propositions";
        justificationsKey = "justifications";
        break;
      case JustificationTargetTypes.STATEMENT:
        entitiesKey = "statements";
        justificationsKey = "justifications";
        break;
      case JustificationTargetTypes.JUSTIFICATION:
        entitiesKey = "justifications";
        justificationsKey = "counterJustifications";
        break;
      default:
        throw newExhaustedEnumError(justification.target.type);
    }
    const target = entities[entitiesKey][targetId];
    const extantTarget = state[entitiesKey][targetId] || {};
    if (!updates[entitiesKey]) {
      updates[entitiesKey] = {};
    }
    updates[entitiesKey][targetId] = {
      ...target,
      [justificationsKey]: union(
        target[justificationsKey],
        extantTarget[justificationsKey],
        [id]
      ),
    };
  });
  return updates;
}

export function makeUpdateRemovingJustificationFromTarget(
  justificationId,
  justificationTargetType,
  justificationTargetId,
  state
) {
  const updates = {};
  let entitiesKey, justificationsKey;
  const targetId = justificationTargetId;
  switch (justificationTargetType) {
    case JustificationTargetTypes.PROPOSITION:
      entitiesKey = "propositions";
      justificationsKey = "justifications";
      break;
    case JustificationTargetTypes.STATEMENT:
      entitiesKey = "statements";
      justificationsKey = "justifications";
      break;
    case JustificationTargetTypes.JUSTIFICATION:
      entitiesKey = "justifications";
      justificationsKey = "counterJustifications";
      break;
    default:
      throw newExhaustedEnumError(justificationTargetType);
  }
  const target = state[entitiesKey][targetId];
  if (!updates[entitiesKey]) {
    updates[entitiesKey] = clone(state[entitiesKey]);
  }
  if (target[justificationsKey]) {
    updates[entitiesKey][targetId] = {
      ...target,
      [justificationsKey]: filter(
        target[justificationsKey],
        (id) => !idEqual(id, justificationId)
      ),
    };
  }
  return updates;
}

const deepMergeOptions = {
  // Overwrite arrays. This prevents us from merging arrays of objects, but since we store our
  // entities normalized, most objects we care about merging will be top-level entities.
  arrayMerge: (_targetArray, sourceArray, _options) => sourceArray,
  // Don't copy the properties of Moment objects (or else we lose their methods.)
  isMergeableObject: isPlainObject,
  // The API sends null where undefined is meant (JSON doesn't have an undefined type, and our
  // code base doesn't use null.)
  customMerge: (_key) => nullToUndefined,
};

/**
 * The API can send partial updates, which only update the fields returned. If
 * the API wants to clear a field, it must return null for that field. The null
 * is converted to undefined.
 */
function createEntityUpdate(state, payloadEntities, key) {
  if (has(payloadEntities, key)) {
    const newEntities = deepMerge(
      state[key],
      payloadEntities[key],
      deepMergeOptions
    );
    return {
      // Use deep merge because lodash's merge doesn't allow us to overwrite
      // with the value undefined.
      [key]: newEntities,
    };
  }
  return undefined;
}

function nullToUndefined(targetValue, srcValue) {
  if (srcValue === null) {
    return undefined;
  }
  return deepMerge(targetValue, srcValue, deepMergeOptions);
}

function optimisticPropositionTagVote(state, action) {
  const {
    propositionTagVote: optimisticPropositionTagVote,
    prevPropositionTagVote,
  } = action.meta;

  const propositionId = optimisticPropositionTagVote.proposition.id;
  const proposition = state.propositions[propositionId];

  const optimisticPropositionTagVotes = concat(
    reject(
      proposition.propositionTagVotes,
      (vote) =>
        vote === prevPropositionTagVote ||
        vote === get(prevPropositionTagVote, "id")
    ),
    [optimisticPropositionTagVote]
  );

  const optimisticTag = optimisticPropositionTagVote.tag;
  const isAlreadyTagged = some(
    proposition.tags,
    (tagId) =>
      tagId === optimisticTag.id ||
      get(state.tags[tagId], "name") === optimisticTag.name
  );
  const optimisticTags = isAlreadyTagged
    ? proposition.tags
    : concat(proposition.tags, optimisticPropositionTagVote.tag);

  const optimisticProposition = {
    ...proposition,
    propositionTagVotes: optimisticPropositionTagVotes,
    tags: optimisticTags,
  };

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [propositionId]: optimisticProposition,
    },
  };
}

function optimisticPropositionTagUnvote(state, action) {
  const { prevPropositionTagVote } = action.meta;
  const {
    proposition: { id: propositionId },
  } = prevPropositionTagVote;
  const proposition = state.propositions[propositionId];

  const optimisticPropositionTagVotes = reject(
    proposition.propositionTagVotes,
    (stv) => stv === prevPropositionTagVote || stv === prevPropositionTagVote.id
  );
  const optimisticProposition = {
    ...proposition,
    propositionTagVotes: optimisticPropositionTagVotes,
  };

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [propositionId]: optimisticProposition,
    },
  };
}

function replaceOptimisticPropositionTagVote(state, action) {
  const { result, entities } = normalize(
    action.payload,
    action.meta.normalizationSchema
  );
  const { propositionTagVote: optimisticPropositionTagVote } =
    action.meta.requestMeta;
  const propositionTagVote =
    entities.propositionTagVotes[result.propositionTagVote];

  const optimisticProposition =
    state.propositions[propositionTagVote.proposition.id];
  const propositionTagVotes = map(
    optimisticProposition.propositionTagVotes,
    (stv) =>
      stv === optimisticPropositionTagVote ? propositionTagVote.id : stv
  );
  const tags = map(optimisticProposition.tags, (tag) =>
    // propositionTagVote.tag will actually be the ID
    tag === optimisticPropositionTagVote.tag ? propositionTagVote.tag : tag
  );
  const proposition = { ...optimisticProposition, propositionTagVotes, tags };

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [proposition.id]: proposition,
    },
  };
}

function revertOptimisticPropositionTagVote(state, action) {
  const {
    propositionTagVote: optimisticPropositionTagVote,
    prevPropositionTagVote,
  } = action.meta.requestMeta;
  // untagging has no optimistic vote, only a previous vote
  const propositionId = get(
    optimisticPropositionTagVote,
    "proposition.id",
    get(prevPropositionTagVote, "proposition.id")
  );
  if (!propositionId) {
    // This shouldn't ever happen...
    return;
  }

  const optimisticProposition = state.propositions[propositionId];
  const revertedPropositionTagVotes = without(
    optimisticProposition.propositionTagVotes,
    optimisticPropositionTagVote
  );
  if (prevPropositionTagVote && prevPropositionTagVote.id) {
    revertedPropositionTagVotes.push(prevPropositionTagVote.id);
  }
  // Most of the normalized tags will be IDs.  But if it was added optimistically, it will be an object, and it will
  //  be equal to the tag of the optimistic vote
  const revertedTags = optimisticPropositionTagVote
    ? reject(
        optimisticProposition.tags,
        (tagId) => tagId === optimisticPropositionTagVote.tag
      )
    : optimisticProposition.tags;

  const revertedProposition = {
    ...optimisticProposition,
    propositionTagVotes: revertedPropositionTagVotes,
    tags: revertedTags,
  };

  return {
    ...state,
    propositions: {
      ...state.propositions,
      [propositionId]: revertedProposition,
    },
  };
}
