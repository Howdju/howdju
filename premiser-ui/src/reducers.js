import { combineReducers } from 'redux'
import merge from 'lodash/merge'

import {
  FETCH_STATEMENTS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_FAILURE,
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS, LOGOUT_FAILURE, LOGIN, LOGIN_FAILURE, LOGIN_CREDENTIAL_CHANGE, SHOW_NAV_DRAWER, HIDE_NAV_DRAWER,
  TOGGLE_NAV_DRAWER_VISIBILITY, SET_NAV_DRAWER_VISIBILITY, ADD_TOAST, DISMISS_TOAST,
} from './actions'

const entities = (state = { statements: {}, justifications: {}, quotes: {} }, action) => {

  switch (action.type) {
    case FETCH_STATEMENTS_SUCCESS:
      return {...state, statements: merge(state.statements, action.payload.entities.statements)}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      return {
        ...state,
        statements: merge(state.statements, action.payload.entities.statements),
        justifications: merge(state.justifications, action.payload.entities.justifications),
        quotes: merge(state.quotes, action.payload.entities.quotes),
      }
  }

  return state
}

const auth = (state = {}, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {...state, authenticationToken: action.payload.authenticationToken, email: action.payload.email}
    // remove auth token even if server fails; that way the user is logged out from client and server will eventually cleanup auth token
    case LOGOUT_SUCCESS:
    case LOGOUT_FAILURE:
      return {...state, authenticationToken: null, email: null}
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

const statementJustificationsPage = (state = {errorMessage: ''}, action) => {
  switch (action.type) {
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      console.error(action.payload);
      return {...state, errorMessage: 'Failed to load justifications'}
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