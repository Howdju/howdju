import { isArray, map, union, isPlainObject } from "lodash";
import { normalize, Schema } from "normalizr";
import deepMergeLib, { Options as DeepMergeOptions } from "deepmerge";
import { AnyAction, createSlice } from "@reduxjs/toolkit";

import {
  EntityId,
  httpStatusCodes,
  newImpossibleError,
  PersistedEntity,
} from "howdju-common";
import { Moment } from "moment";

import { api } from "../actions";
import { ApiErrorPayload } from "@/types";
import { matchActions } from "@/reducerUtils";
import {
  appearanceSchema,
  contextTrailItemSchema,
  justificationSchema,
  justificationVoteSchema,
  mediaExcerptSchema,
  persorgSchema,
  propositionCompoundSchema,
  propositionSchema,
  mediaExcerptCitationSchema,
  mediaExcerptSpeakerSchema,
  propositionCompoundAtomSchema,
  sourceSchema,
  statementSchema,
  tagSchema,
  urlLocatorSchema,
  userSchema,
  writQuoteSchema,
  writSchema,
  mediaExcerptCitationKey,
  mediaExcerptSpeakerKey,
  propositionTagVoteSchema,
} from "@/normalizationSchemas";
import { MergeDeep } from "type-fest";

type ModelKey = string;
/**
 * A non-entity model stored in the normalized state.
 *
 * We store both Howdju entities and non-entity models inside normalizr. Normalizr
 * calls these entities, but we distinguish between Howdju entities, which are
 * persisted in a table with an `id`, and models, which are usually relationships
 * and require a generated `key` to identify them in the normalizr state.
 */
type KeyedModel = { key: ModelKey };
type SchemaEntity = PersistedEntity | KeyedModel;
type NormalizedEntity<T extends SchemaEntity> = NormalizeRelated<T>;
type NormalizeRelated<T> = {
  [key in keyof T]: T[key] extends SchemaEntity[]
    ? string[]
    : T[key] extends SchemaEntity[] | undefined
    ? string[] | undefined
    : T[key] extends SchemaEntity
    ? string
    : T[key] extends Moment
    ? T[key]
    : T[key] extends object
    ? NormalizeRelated<T[key]>
    : T[key];
};
type NormalizedUnion = { schema: string; id: string };

/**
 * @typeparam O overrides. The type of a normalizr schema definition is not accessible,
 * and so we must manually provide information about unions which don't follow the usual
 * pattern of NormalizeRelated, if we want to rely on the types of these unions in our reducers.
 */
type EntityState<T extends SchemaEntity, O = Record<string, never>> = Record<
  string,
  O extends Record<string, never>
    ? NormalizedEntity<T>
    : MergeDeep<NormalizedEntity<T>, O>
>;
type SchemaEntityState<
  S extends Schema,
  O = Record<string, never>
> = S extends Schema<infer E>
  ? E extends SchemaEntity
    ? EntityState<E, O>
    : never
  : never;

export const initialState = {
  appearances: {} as SchemaEntityState<typeof appearanceSchema>,
  contextTrailItems: {} as SchemaEntityState<typeof contextTrailItemSchema>,
  justifications: {} as SchemaEntityState<
    typeof justificationSchema,
    {
      rootTarget: NormalizedUnion;
      target: {
        entity: NormalizedUnion;
      };
      basis: {
        entity: NormalizedUnion;
      };
    }
  >,
  justificationVotes: {} as SchemaEntityState<typeof justificationVoteSchema>,
  mediaExcerpts: {} as SchemaEntityState<
    typeof mediaExcerptSchema,
    {
      citations: ModelKey[];
    }
  >,
  mediaExcerptCitations: {} as SchemaEntityState<
    typeof mediaExcerptCitationSchema
  >,
  mediaExcerptSpeakers: {} as SchemaEntityState<
    typeof mediaExcerptSpeakerSchema
  >,
  persorgs: {} as SchemaEntityState<typeof persorgSchema>,
  propositions: {} as SchemaEntityState<typeof propositionSchema>,
  propositionCompounds: {} as SchemaEntityState<
    typeof propositionCompoundSchema
  >,
  propositionCompoundAtoms: {} as SchemaEntityState<
    typeof propositionCompoundAtomSchema
  >,
  propositionTagVotes: {} as SchemaEntityState<typeof propositionTagVoteSchema>,
  sources: {} as SchemaEntityState<typeof sourceSchema>,
  statements: {} as SchemaEntityState<typeof statementSchema>,
  tags: {} as SchemaEntityState<typeof tagSchema>,
  urlLocators: {} as SchemaEntityState<typeof urlLocatorSchema>,
  users: {} as SchemaEntityState<typeof userSchema>,
  writs: {} as SchemaEntityState<typeof writSchema>,
  writQuotes: {} as SchemaEntityState<typeof writQuoteSchema>,
};
export type State = typeof initialState;
export type NormalizedProposition = State["propositions"][EntityId];
export type NormalizedStatement = State["statements"][EntityId];
export type NormalizedJustification = State["justifications"][EntityId];

const apiResponseActionTypes = new Set(
  map(api, (apiAction) => apiAction.response.type)
);

type ApiResponseAction = ReturnType<typeof api[keyof typeof api]["response"]>;

function isApiResponseAction(action: AnyAction): action is ApiResponseAction {
  return apiResponseActionTypes.has(action.type);
}

const slice = createSlice({
  name: "entities",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(
      api.fetchPropositionRootJustificationTarget.response,
      (state, action) => {
        if (!action.error) {
          return;
        }
        const payload = action.payload as unknown as ApiErrorPayload;
        if (payload.httpStatusCode !== httpStatusCodes.NOT_FOUND) {
          // If a proposition is not found (e.g., another user deleted it), then remove it.
          const { rootTargetId } = action.meta.requestMeta;
          delete state.propositions[rootTargetId];
        }
      }
    );
    builder.addCase(
      api.fetchStatementRootJustificationTarget.response,
      (state, action) => {
        if (!action.error) {
          return;
        }
        const payload = action.payload as unknown as ApiErrorPayload;
        // If a proposition is not found (e.g., another user deleted it), then remove it.
        if (payload.httpStatusCode === httpStatusCodes.NOT_FOUND) {
          const { rootTargetId } = action.meta.requestMeta;
          delete state.statements[rootTargetId];
        }
      }
    );
    builder.addCase(api.deleteProposition.response, (state, action) => {
      if (action.error) {
        return;
      }
      delete state.propositions[action.meta.requestMeta.propositionId];
    });
    builder.addCase(api.createJustification.response, (state, action) => {
      if (action.error) {
        return;
      }
      const { entities } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      const justifications = entities.justifications;
      if (!justifications) {
        throw newImpossibleError(
          "createJustification must return a justification"
        );
      }
      const justification = justifications[action.payload.justification.id];
      switch (justification.target.type) {
        case "PROPOSITION": {
          const propositions = entities.propositions;
          if (!propositions) {
            throw newImpossibleError(
              "createJustification must return a proposition if the justification's target is one."
            );
          }
          const proposition = propositions[justification.target.entity.id];
          if (!proposition.justifications) {
            proposition.justifications = [];
          }
          proposition.justifications.push(justification.id);
          state.propositions[proposition.id] = deepMerge(
            state.propositions[proposition.id],
            proposition
          );
          break;
        }
        case "STATEMENT": {
          const statements = entities.statements;
          if (!statements) {
            throw newImpossibleError(
              "createJustification must return a statement if the justification's target is one."
            );
          }
          const statement = statements[justification.target.entity.id];
          if (!statement.justifications) {
            statement.justifications = [];
          }
          statement.justifications.push(justification.id);
          state.statements[statement.id] = deepMerge<NormalizedStatement>(
            state.statements[statement.id],
            statement
          );
          break;
        }
        case "JUSTIFICATION": {
          const targetJustification =
            justifications[justification.target.entity.id];
          if (!targetJustification.counterJustifications) {
            targetJustification.counterJustifications = [];
          }
          targetJustification.counterJustifications.push(justification.id);
          state.justifications[targetJustification.id] =
            deepMerge<NormalizedJustification>(
              state.justifications[targetJustification.id],
              targetJustification
            );
          break;
        }
      }
    });
    builder.addCase(api.createUrlLocators.response, (state, action) => {
      if (action.error) {
        return;
      }
      action.payload.urlLocators.forEach((urlLocator) => {
        state.mediaExcerpts[
          urlLocator.mediaExcerptId
        ].locators.urlLocators.push(urlLocator.id);
      });
    });
    builder.addCase(
      api.createMediaExcerptCitations.response,
      (state, action) => {
        if (action.error) {
          return;
        }
        action.payload.citations.forEach((citation) => {
          const key = mediaExcerptCitationKey(citation);
          state.mediaExcerpts[citation.mediaExcerptId].citations.push(key);
        });
      }
    );
    builder.addCase(
      api.createMediaExcerptSpeakers.response,
      (state, action) => {
        if (action.error) {
          return;
        }
        action.payload.speakers.forEach((speaker) => {
          const key = mediaExcerptSpeakerKey(speaker);
          state.mediaExcerpts[speaker.mediaExcerptId].speakers.push(key);
        });
      }
    );
    builder.addCase(api.deleteUrlLocator.response, (state, action) => {
      if (action.error) {
        return;
      }
      const { urlLocatorId, mediaExcerptId } = action.meta.requestMeta;
      delete state.urlLocators[urlLocatorId];

      const mediaExcerpt = state.mediaExcerpts[mediaExcerptId];
      const index = mediaExcerpt.locators.urlLocators.indexOf(urlLocatorId);
      mediaExcerpt.locators.urlLocators.splice(index, 1);
    });
    builder.addCase(
      api.deleteMediaExcerptCitation.response,
      (state, action) => {
        if (action.error) {
          return;
        }
        const { mediaExcerptId, sourceId, normalPincite } =
          action.meta.requestMeta;
        const key = mediaExcerptCitationKey({
          mediaExcerptId,
          sourceId,
          normalPincite,
        });
        delete state.mediaExcerptCitations[key];

        const mediaExcerpt = state.mediaExcerpts[mediaExcerptId];
        const index = mediaExcerpt.citations.indexOf(key);
        mediaExcerpt.citations.splice(index, 1);
      }
    );
    builder.addCase(api.deleteMediaExcerptSpeaker.response, (state, action) => {
      if (action.error) {
        return;
      }
      const { mediaExcerptId, persorgId } = action.meta.requestMeta;
      const key = mediaExcerptSpeakerKey({
        mediaExcerptId,
        persorgId,
      });
      delete state.mediaExcerptSpeakers[key];

      const mediaExcerpt = state.mediaExcerpts[mediaExcerptId];
      const index = mediaExcerpt.speakers.indexOf(key);
      mediaExcerpt.speakers.splice(index, 1);
    });
    builder.addCase(
      api.createCounterJustification.response,
      (state, action) => {
        if (action.error) {
          return;
        }
        const { entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        const justifications = entities.justifications;
        if (!justifications) {
          throw newImpossibleError(
            "createCounterJustification must return justifications"
          );
        }
        const justification = justifications[action.payload.justification.id];
        const targetJustification =
          justifications[justification.target.entity.id];
        if (!targetJustification.counterJustifications) {
          targetJustification.counterJustifications = [];
        }
        targetJustification.counterJustifications.push(justification.id);
        state.justifications[targetJustification.id] =
          deepMerge<NormalizedJustification>(
            state.justifications[targetJustification.id],
            targetJustification
          );
      }
    );
    builder.addCase(api.deleteJustification.response, (state, action) => {
      if (action.error) {
        return;
      }
      const { justificationId } = action.meta.requestMeta;
      const justification = state.justifications[justificationId];
      delete state.justifications[justificationId];

      switch (justification.target.type) {
        case "PROPOSITION": {
          const proposition =
            state.propositions[justification.target.entity.id];
          const index = proposition.justifications?.indexOf(justificationId);
          if (index === undefined || index < 0) {
            return;
          }
          proposition.justifications?.splice(index, 1);
          break;
        }
        case "STATEMENT": {
          const statement = state.statements[justification.target.entity.id];
          const index = statement.justifications?.indexOf(justificationId);
          if (index === undefined || index < 0) {
            return;
          }
          statement.justifications?.splice(index, 1);
          break;
        }
        case "JUSTIFICATION": {
          const targetJustification =
            state.justifications[justification.target.entity.id];
          const index =
            targetJustification.counterJustifications?.indexOf(justificationId);
          if (index === undefined || index < 0) {
            return;
          }
          targetJustification.counterJustifications?.splice(index, 1);
          break;
        }
      }
    });
    builder.addCase(api.tagProposition.response, (state, action) => {
      if (action.error) {
        return;
      }
      const tagVote = action.payload.propositionTagVote;
      const proposition = state.propositions[tagVote.proposition.id];
      if (!proposition.tags) {
        proposition.tags = [];
      }
      // Add the tag to the proposition
      proposition.tags = union(proposition.tags, [tagVote.tag.id]);
      if (!proposition.propositionTagVotes) {
        proposition.propositionTagVotes = [];
      }
      // Remove iconsistent votes
      proposition.propositionTagVotes = proposition.propositionTagVotes.filter(
        (v) => state.propositionTagVotes[v].tag !== tagVote.tag.id
      );
      // Add the vote
      proposition.propositionTagVotes.push(tagVote.id);
    });
    builder.addCase(api.antiTagProposition.response, (state, action) => {
      if (action.error) {
        return;
      }
      const tagVote = action.payload.propositionTagVote;
      const proposition = state.propositions[tagVote.proposition.id];
      if (!proposition.propositionTagVotes) {
        proposition.propositionTagVotes = [];
      }
      // Remove iconsistent votes
      proposition.propositionTagVotes = proposition.propositionTagVotes.filter(
        (v) => state.propositionTagVotes[v].tag !== tagVote.tag.id
      );
      // Add the vote
      proposition.propositionTagVotes.push(tagVote.id);
    });
    builder.addCase(api.unTagProposition.response, (state, action) => {
      if (action.error) {
        return;
      }
      const prevTagVote = action.meta.requestMeta.prevPropositionTagVote;
      const proposition = state.propositions[prevTagVote.proposition.id];
      if (proposition.propositionTagVotes) {
        const voteId = prevTagVote.id;
        const voteIndex = proposition.propositionTagVotes.indexOf(voteId);
        if (voteIndex > -1) {
          proposition.propositionTagVotes.splice(voteIndex, 1);
        }
      }
    });
    // TODO addase for api.untagProposition
    builder.addMatcher(
      matchActions(api.verifyJustification, api.disverifyJustification),
      (state, action) => {
        // Optimistically apply vote
        const vote = action.meta.justificationVote;
        const { justificationId } = vote;
        const justification = state.justifications[justificationId];
        justification.vote = { ...vote, justification };
      }
    );
    builder.addMatcher(
      matchActions(api.unVerifyJustification, api.unDisverifyJustification),
      (state, action) => {
        // Optimistically remove vote
        const { justificationId } = action.meta.justificationVote;
        delete state.justifications[justificationId].vote;
      }
    );
    builder.addMatcher(
      matchActions(
        api.verifyJustification.response,
        api.disverifyJustification.response
      ),
      (state, action) => {
        if (action.error) {
          return;
        }
        const { result, entities } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        // Apply the returned vote
        const vote = entities.justificationVotes?.[result.justificationVote];
        if (!vote) {
          throw newImpossibleError(
            "verifyJustification must return a justification vote"
          );
        }
        state.justifications[vote.justificationId].vote = vote;
      }
    );
    builder.addMatcher(
      matchActions(
        api.verifyJustification.response,
        api.unVerifyJustification.response,
        api.disverifyJustification.response,
        api.unDisverifyJustification.response
      ),
      (state, action) => {
        if (!action.error) {
          return;
        }
        // Undo optimistic vote
        const { justificationId, previousJustificationVote } =
          action.meta.requestMeta;
        const justification = state.justifications[justificationId];
        justification.vote = previousJustificationVote;
      }
    );
    builder.addMatcher(isApiResponseAction, (state, action) => {
      if (action.error) {
        // Errors do not return entities.
        return;
      }
      if (!action.payload || !action.meta.normalizationSchema) {
        // Some responses, like delete responses, don't return a payload or don't
        // provide a normalization schema because they don't return entities.
        return;
      }
      const { entities } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );

      /**
       * The API can send partial updates, which only update the fields returned. If
       * the API wants to clear a field, it must return null for that field. The null
       * is converted to undefined.
       */
      return deepMerge(state, entities) as State;
    });
  },
});

export function deepMerge<T>(x: Partial<T>, y: Partial<T>): T;
export function deepMerge<T1, T2>(x: Partial<T1>, y: Partial<T2>): T1 & T2;
export function deepMerge<T1, T2>(x: Partial<T1>, y: Partial<T2>): T1 & T2 {
  return deepMergeLib(x, y, deepMergeOptions);
}

export const deepMergeOptions: DeepMergeOptions = {
  // Overwrite arrays. This prevents us from merging arrays of objects, but since we store our
  // entities normalized, most objects we care about merging will be top-level entities.
  arrayMerge: (targetArray, sourceArray, _options) =>
    union(targetArray, sourceArray),
  // Don't copy the properties of Moment objects (or else we lose their methods.)
  isMergeableObject: (val) => isPlainObject(val) || isArray(val),
  // The API sends null where undefined is meant (JSON doesn't have an undefined type, and our
  // code base doesn't use null.)
  customMerge: (_key) => nullToUndefined,
};

function nullToUndefined(targetValue: any, srcValue: any) {
  if (srcValue === null) {
    return undefined;
  }
  return deepMerge(targetValue, srcValue);
}

export default slice.reducer;
