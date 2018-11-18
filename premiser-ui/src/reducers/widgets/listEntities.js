import {handleActions} from "redux-actions"
import get from 'lodash/get'
import union from 'lodash/union'

import {
  api,
} from '../../actions'
import pickBy from 'lodash/pickBy'

const widgetRequestReducer = (defaultWidgetState) => (state, action) => {
  const widgetId = action.payload.widgetId
  const widgetState = get(state, widgetId, defaultWidgetState)
  const newWidgetState = {...widgetState, isFetching: true}
  return {...state, [widgetId]: newWidgetState}
}
const widgetResponseReducer = (defaultWidgetState, entitiesWidgetStateKey, entitiesResultKey) => (state, action) => {
  const widgetId = action.meta.requestPayload.widgetId
  const widgetState = get(state, widgetId, defaultWidgetState)
  const newWidgetState = {
    [entitiesWidgetStateKey]: union(widgetState[entitiesWidgetStateKey], action.payload.result[entitiesResultKey]),
    continuationToken: action.payload.result.continuationToken,
    isFetching: false,
  }

  return {...state, [widgetId]: newWidgetState}
}
const widgetResponseErrorReducer = (defaultWidgetState) => (state, action) => {
  const widgetId = action.meta.requestPayload.widgetId
  const widgetState = get(state, widgetId, defaultWidgetState)
  const newWidgetState = {...widgetState, isFetching: false, didError: true}
  return {...state, [widgetId]: newWidgetState}
}
const widgetDeleteResponseReducer = (defaultWidgetState, entitiesWidgetStateKey, entitiesResultKey) => (state, action) => {
  const widgetId = action.meta.requestPayload.widgetId
  const widgetState = get(state, widgetId, defaultWidgetState)
  const newWidgetState = {
    [entitiesWidgetStateKey]: pickBy(widgetState[entitiesWidgetStateKey], (e, id) => id !== action.payload.result[entitiesResultKey].id),
  }

  return {...state, [widgetId]: newWidgetState}
}

const defaultRecentPropositionsWidgetState = {recentPropositions: [], continuationToken: null}
const defaultRecentWritsWidgetState = {recentWrits: [], continuationToken: null}
const defaultRecentWritQuotesWidgetState = {recentWritQuotes: [], continuationToken: null}
const defaultRecentJustificationsWidgetState = {recentJustifications: [], continuationToken: null}
export default handleActions({
  [api.fetchRecentPropositions]: widgetRequestReducer(defaultRecentPropositionsWidgetState),
  [api.fetchRecentPropositions.response]: {
    next: widgetResponseReducer(defaultRecentPropositionsWidgetState, 'recentPropositions', 'propositions'),
    throw: widgetResponseErrorReducer(defaultRecentPropositionsWidgetState),
  },
  [api.deleteProposition.response]: {
    next: widgetDeleteResponseReducer(defaultRecentPropositionsWidgetState, 'recentPropositions', 'propositions'),
  },
  [api.fetchRecentWrits]: widgetRequestReducer(defaultRecentWritsWidgetState),
  [api.fetchRecentWrits.response]: {
    next: widgetResponseReducer(defaultRecentWritsWidgetState, 'recentWrits', 'writs'),
    throw: widgetResponseErrorReducer(defaultRecentWritsWidgetState),
  },
  [api.fetchRecentWritQuotes]: widgetRequestReducer(defaultRecentWritQuotesWidgetState),
  [api.fetchRecentWritQuotes.response]: {
    next: widgetResponseReducer(defaultRecentWritQuotesWidgetState, 'recentWritQuotes', 'writQuotes'),
    throw: widgetResponseErrorReducer(defaultRecentWritQuotesWidgetState),
  },
  [api.fetchRecentJustifications]: widgetRequestReducer(defaultRecentJustificationsWidgetState),
  [api.fetchRecentJustifications.response]: {
    next: widgetResponseReducer(defaultRecentJustificationsWidgetState, 'recentJustifications', 'justifications'),
    throw: widgetResponseErrorReducer(defaultRecentJustificationsWidgetState),
  },
  [api.deleteJustification.response]: {
    next: widgetDeleteResponseReducer(defaultRecentJustificationsWidgetState, 'recentJustifications', 'justifications'),
  }
}, {})
