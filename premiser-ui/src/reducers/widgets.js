import {combineActions, handleActions} from "redux-actions";
import union from 'lodash/union'
import get from 'lodash/get'

import {api} from '../actions'

export default handleActions({
  [combineActions(
      api.fetchRecentStatements.response,
      api.fetchMoreRecentStatements.response,
  )]: {
    next: (state, action) => {
      const widgetState = get(state, action.meta.requestPayload.widgetId, {recentStatements: []})
      const newWidgetState = {
        recentStatements: union(widgetState.recentStatements, action.payload.result.statements),
        continuationToken: action.payload.result.continuationToken
      }

      return {...state, [action.meta.requestPayload.widgetId]: newWidgetState}
    }
  },
  [combineActions(
      api.fetchRecentCitations.response,
      api.fetchMoreRecentCitations.response,
  )]: {
    next: (state, action) => {
      const widgetState = get(state, action.meta.requestPayload.widgetId, {recentCitations: []})
      const newWidgetState = {
        recentCitations: union(widgetState.recentCitations, action.payload.result.citations),
        continuationToken: action.payload.result.continuationToken
      }

      return {...state, [action.meta.requestPayload.widgetId]: newWidgetState}
    }
  },
  [combineActions(
      api.fetchRecentJustifications.response,
      api.fetchMoreRecentJustifications.response,
  )]: {
    next: (state, action) => {
      const widgetState = get(state, action.meta.requestPayload.widgetId, {recentJustifications: []})
      const newWidgetState = {
        recentJustifications: union(widgetState.recentJustifications, action.payload.result.justifications),
        continuationToken: action.payload.result.continuationToken
      }

      return {...state, [action.meta.requestPayload.widgetId]: newWidgetState}
    }
  },
}, {})