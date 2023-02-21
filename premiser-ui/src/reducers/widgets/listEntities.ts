import { handleActions } from "redux-actions";
import { AnyAction } from "@reduxjs/toolkit";
import { normalize } from "normalizr";
import get from "lodash/get";
import union from "lodash/union";
import { filter } from "lodash";

import { api, str } from "../../actions";

const widgetRequestReducer =
  <T extends BaseListEntitiesState>(defaultWidgetState: T) =>
  (state: Record<string, T>, action: AnyAction) => {
    const widgetId = action.meta.widgetId;
    const widgetState = get(state, widgetId, defaultWidgetState);
    const newWidgetState = { ...widgetState, isFetching: true };
    return { ...state, [widgetId]: newWidgetState };
  };
const widgetResponseReducer =
  <T extends BaseListEntitiesState>(
    defaultWidgetState: T,
    entitiesWidgetStateKey: string,
    entitiesResultKey: string
  ) =>
  (state: Record<string, T>, action: AnyAction) => {
    const { result } = normalize(
      action.payload,
      action.meta.normalizationSchema
    );
    const widgetId = action.meta.requestMeta.widgetId;
    const widgetState = get(state, widgetId, defaultWidgetState);
    const newWidgetState = {
      [entitiesWidgetStateKey]: union(
        widgetState[entitiesWidgetStateKey as keyof T] as ArrayLike<unknown>,
        result[entitiesResultKey]
      ),
      continuationToken: result.continuationToken,
      isFetching: false,
    };

    return { ...state, [widgetId]: newWidgetState };
  };
const widgetResponseErrorReducer =
  <T extends BaseListEntitiesState>(defaultWidgetState: T) =>
  (state: Record<string, T>, action: AnyAction) => {
    const widgetId = action.meta.requestMeta.widgetId;
    const widgetState = get(state, widgetId, defaultWidgetState);
    const newWidgetState = {
      ...widgetState,
      isFetching: false,
      didError: true,
    };
    return { ...state, [widgetId]: newWidgetState };
  };
const widgetDeleteResponseReducer =
  <T extends BaseListEntitiesState>(
    defaultWidgetState: T,
    entitiesWidgetStateKey: string,
    entitiesResultKey: string
  ) =>
  (state: Record<string, T>, action: AnyAction) => {
    const widgetId = action.meta.requestMeta.widgetId;
    const widgetState = get(state, widgetId, defaultWidgetState);
    const newWidgetState = {
      [entitiesWidgetStateKey]: filter(
        widgetState[entitiesWidgetStateKey as keyof T] as ArrayLike<{
          id: string;
        }>,
        // TODO(1): does payload.result exist? Above we are normalizing the response payload.
        (e) => e.id !== action.payload.result[entitiesResultKey].id
      ),
    };

    return { ...state, [widgetId]: newWidgetState };
  };

interface BaseListEntitiesState {
  continuationToken?: string;
  isFetching: boolean;
  didError: boolean;
}

const defaultRecentPropositionsWidgetState = {
  recentPropositions: [],
  continuationToken: undefined,
  isFetching: false,
  didError: false,
} as BaseListEntitiesState;
const defaultRecentWritsWidgetState = {
  recentWrits: [],
  continuationToken: undefined,
  isFetching: false,
  didError: false,
} as BaseListEntitiesState;
const defaultRecentWritQuotesWidgetState = {
  recentWritQuotes: [],
  continuationToken: undefined,
  isFetching: false,
  didError: false,
} as BaseListEntitiesState;
const defaultRecentJustificationsWidgetState = {
  recentJustifications: [],
  continuationToken: undefined,
  isFetching: false,
  didError: false,
} as BaseListEntitiesState;
export default handleActions<
  Record<string, BaseListEntitiesState>,
  { widgetId: string }
>(
  {
    [str(api.fetchRecentPropositions)]: widgetRequestReducer(
      defaultRecentPropositionsWidgetState
    ),
    [str(api.fetchRecentPropositions.response)]: {
      next: widgetResponseReducer(
        defaultRecentPropositionsWidgetState,
        "recentPropositions",
        "propositions"
      ),
      throw: widgetResponseErrorReducer(defaultRecentPropositionsWidgetState),
    },
    [str(api.deleteProposition.response)]: {
      next: widgetDeleteResponseReducer(
        defaultRecentPropositionsWidgetState,
        "recentPropositions",
        "propositions"
      ),
    },
    [str(api.fetchRecentWrits)]: widgetRequestReducer(
      defaultRecentWritsWidgetState
    ),
    [str(api.fetchRecentWrits.response)]: {
      next: widgetResponseReducer(
        defaultRecentWritsWidgetState,
        "recentWrits",
        "writs"
      ),
      throw: widgetResponseErrorReducer(defaultRecentWritsWidgetState),
    },
    [str(api.fetchRecentWritQuotes)]: widgetRequestReducer(
      defaultRecentWritQuotesWidgetState
    ),
    [str(api.fetchRecentWritQuotes.response)]: {
      next: widgetResponseReducer(
        defaultRecentWritQuotesWidgetState,
        "recentWritQuotes",
        "writQuotes"
      ),
      throw: widgetResponseErrorReducer(defaultRecentWritQuotesWidgetState),
    },
    [str(api.fetchRecentJustifications)]: widgetRequestReducer(
      defaultRecentJustificationsWidgetState
    ),
    [str(api.fetchRecentJustifications.response)]: {
      next: widgetResponseReducer(
        defaultRecentJustificationsWidgetState,
        "recentJustifications",
        "justifications"
      ),
      throw: widgetResponseErrorReducer(defaultRecentJustificationsWidgetState),
    },
    [str(api.deleteJustification.response)]: {
      next: widgetDeleteResponseReducer(
        defaultRecentJustificationsWidgetState,
        "recentJustifications",
        "justifications"
      ),
    },
  },
  {}
);
