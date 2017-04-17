import { combineReducers } from 'redux'
import merge from 'lodash/merge'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import {VotePolarity, VoteTargetType} from './models'

import {
  FETCH_STATEMENTS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_FAILURE,
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS, LOGOUT_FAILURE, LOGIN, LOGIN_FAILURE, LOGIN_CREDENTIAL_CHANGE, SHOW_NAV_DRAWER, HIDE_NAV_DRAWER,
  TOGGLE_NAV_DRAWER_VISIBILITY, SET_NAV_DRAWER_VISIBILITY, ADD_TOAST, DISMISS_TOAST, FETCH_STATEMENT_JUSTIFICATIONS,
  VERIFY_JUSTIFICATION, VERIFY_JUSTIFICATION_SUCCESS, VERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION_FAILURE,
  DISVERIFY_JUSTIFICATION_FAILURE, UN_DISVERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION,
  UN_DISVERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION_SUCCESS,
} from './actions'

const indexJustificationsByRootStatementId = (justifications => {
  const justificationsByRootStatementId = groupBy(justifications, j => j.rootStatementId)
  for (let statementId of Object.keys(justificationsByRootStatementId)) {
    justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], 'id')
    // justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => normalize(j, justificationSchema).results)
  }
  return justificationsByRootStatementId
})

const entities = (state = {
    statements: {},
    justifications: {},
    justificationsByRootStatementId: {},
    quotes: {},
    votes: {}
  }, action) => {

  switch (action.type) {
    case FETCH_STATEMENTS_SUCCESS:
      return {...state, statements: merge(state.statements, action.payload.entities.statements)}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      const justificationsByRootStatementId = indexJustificationsByRootStatementId(action.payload.entities.justifications)
      return {
        ...state,
        statements: merge({}, state.statements, action.payload.entities.statements),
        justifications: merge({}, state.justifications, action.payload.entities.justifications),
        votes: merge({}, state.votes, action.payload.entities.votes),
        justificationsByRootStatementId: merge({}, state.justificationsByRootStatementId, justificationsByRootStatementId),
        quotes: merge({}, state.quotes, action.payload.entities.quotes),
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
  }

  return state
}

const auth = (state = {}, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {...state, authToken: action.payload.authToken, email: action.payload.email}
    // remove auth token even if server fails; that way the user is logged out from client and server will eventually cleanup auth token
    case LOGOUT_SUCCESS:
    case LOGOUT_FAILURE:
      return {...state, authToken: null, email: null}
  }

  return state
}

// const loginErrorMessage = (status) => {
//   switch (status) {
//     case 400:
//       return 'Invalid credentials'
//     case 403:
//       return 'Incorrect password'
//     case 404:
//       return 'Email does not exist'
//     default:
//       return 'Unable to complete login at this time'
//   }
// }

const loginPage = (state = {isLoggingIn: false, errorMessage: '', credentials: {email: '', password: ''}}, action) => {
  switch (action.type) {
    case LOGIN:
      return merge({}, state, {isLoggingIn: true, credentials: action.payload.credentials })
    case LOGIN_SUCCESS:
      return merge({}, state, {isLoggingIn: false, credentials: {email: '', password: ''}})
    case LOGIN_FAILURE:
      return merge({}, state, {isLoggingIn: false, errorMessage: action.payload.message})
    case LOGIN_CREDENTIAL_CHANGE:
      return merge({}, state, {errorMessage: '', credentials: action.payload})
  }

  return state
}

const statementJustificationsPage = (state = {errorMessage: '', isFetching: false}, action) => {
  switch (action.type) {
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      return {...state, errorMessage: 'Failed to load justifications', isFetching: false}
    case FETCH_STATEMENT_JUSTIFICATIONS:
      return {...state, errorMessage: '', isFetching: true}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      return {...state, isFetching: false}

  }

  return state
}

const appUi = (state = {isNavDrawerVisible: false, toasts: []}, action) => {
  switch (action.type) {
    case SHOW_NAV_DRAWER:
      return {...state, isNavDrawerVisible: true}
    case HIDE_NAV_DRAWER:
      return {...state, isNavDrawerVisible: false}
    case TOGGLE_NAV_DRAWER_VISIBILITY:
      return {...state, isNavDrawerVisible: !state.isNavDrawerVisible}
    case SET_NAV_DRAWER_VISIBILITY:
      return {...state, isNavDrawerVisible: action.payload.visible}

    case ADD_TOAST:
      return {...state, toasts: state.toasts.concat(action.payload)}
    case DISMISS_TOAST:
      return {...state, toasts: state.toasts.slice(1)}
  }

  return state
}

const ui = combineReducers({
  loginPage,
  statementJustificationsPage,
  app: appUi,
})

export default combineReducers({
  auth,
  ui,
  entities,
})