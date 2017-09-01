import {handleActions} from "redux-actions"
import get from 'lodash/get'
import union from 'lodash/union'

import {
  api,
  ui
} from '../../actions'

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
const clearWidgetStateReducer = (defaultWidgetState) => (state, action) => {
  const widgetId = action.payload.widgetId
  const widgetState = get(state, widgetId)
  if (widgetState) {
    const newWidgetState = {...widgetState, ...defaultWidgetState}
    return {...state, [widgetId]: newWidgetState}
  }
  return state
}

const defaultRecentStatementsWidgetState = {recentStatements: [], continuationToken: null}
const defaultRecentCitationsWidgetState = {recentCitations: [], continuationToken: null}
const defaultRecentCitationReferencesWidgetState = {recentCitationReferences: [], continuationToken: null}
const defaultRecentJustificationsWidgetState = {recentJustifications: [], continuationToken: null}
export default handleActions({
  [api.fetchRecentStatements]: widgetRequestReducer(defaultRecentStatementsWidgetState),
  [api.fetchRecentStatements.response]: {
    next: widgetResponseReducer(defaultRecentStatementsWidgetState, 'recentStatements', 'statements'),
    throw: widgetResponseErrorReducer(defaultRecentStatementsWidgetState),
  },
  [api.fetchRecentCitations]: widgetRequestReducer(defaultRecentCitationsWidgetState),
  [api.fetchRecentCitations.response]: {
    next: widgetResponseReducer(defaultRecentCitationsWidgetState, 'recentCitations', 'citations'),
    throw: widgetResponseErrorReducer(defaultRecentCitationsWidgetState),
  },
  [api.fetchRecentCitationReferences]: widgetRequestReducer(defaultRecentCitationReferencesWidgetState),
  [api.fetchRecentCitationReferences.response]: {
    next: widgetResponseReducer(defaultRecentCitationReferencesWidgetState, 'recentCitationReferences', 'citationReferences'),
    throw: widgetResponseErrorReducer(defaultRecentCitationReferencesWidgetState),
  },
  [api.fetchRecentJustifications]: widgetRequestReducer(defaultRecentJustificationsWidgetState),
  [api.fetchRecentJustifications.response]: {
    next: widgetResponseReducer(defaultRecentJustificationsWidgetState, 'recentJustifications', 'justifications'),
    throw: widgetResponseErrorReducer(defaultRecentJustificationsWidgetState),
  },
  [ui.clearRecentStatements]: clearWidgetStateReducer(defaultRecentStatementsWidgetState),
  [ui.clearRecentCitations]: clearWidgetStateReducer(defaultRecentCitationsWidgetState),
  [ui.clearRecentCitationReferences]: clearWidgetStateReducer(defaultRecentCitationReferencesWidgetState),
  [ui.clearRecentJustifications]: clearWidgetStateReducer(defaultRecentJustificationsWidgetState),
}, {})
