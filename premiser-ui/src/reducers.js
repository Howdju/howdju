import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import isArray from 'lodash/isArray'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'
import groupBy from 'lodash/groupBy'
import pickBy from 'lodash/pickBy'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import filter from 'lodash/filter'
import union from 'lodash/union'
import {LOCATION_CHANGE} from 'react-router-redux'
import {
  JustificationBasisType, JustificationPolarity, JustificationTargetType, VotePolarity,
  VoteTargetType
} from './models'
import paths from './paths'

import {
  FETCH_STATEMENTS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_FAILURE,
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS, LOGOUT_FAILURE, LOGIN, LOGIN_FAILURE, LOGIN_CREDENTIAL_CHANGE, SHOW_NAV_DRAWER, HIDE_NAV_DRAWER,
  TOGGLE_NAV_DRAWER_VISIBILITY, SET_NAV_DRAWER_VISIBILITY, ADD_TOAST, DISMISS_TOAST, FETCH_STATEMENT_JUSTIFICATIONS,
  VERIFY_JUSTIFICATION, VERIFY_JUSTIFICATION_SUCCESS, VERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION_FAILURE,
  DISVERIFY_JUSTIFICATION_FAILURE, UN_DISVERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION,
  UN_DISVERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION_SUCCESS, LOGIN_REDIRECT, CREATE_STATEMENT_PROPERTY_CHANGE,
  CREATE_STATEMENT, CREATE_STATEMENT_SUCCESS, CREATE_STATEMENT_FAILURE, DELETE_STATEMENT_SUCCESS,
  NEW_JUSTIFICATION_PROPERTY_CHANGE, ADD_NEW_JUSTIFICATION, CLEAR_NEW_JUSTIFICATION, DELETE_JUSTIFICATION_SUCCESS,
  CREATE_JUSTIFICATION_SUCCESS, SHOW_ADD_NEW_JUSTIFICATION, HIDE_ADD_NEW_JUSTIFICATION, RESET_NEW_JUSTIFICATION,
  CREATE_JUSTIFICATION_FAILURE, ADD_NEW_JUSTIFICATION_URL, DELETE_NEW_JUSTIFICATION_URL,
} from './actions'
import text, {CREATE_JUSTIFICATION_FAILURE_MESSAGE} from "./texts";

const unionArraysCustomizer = (destVal, srcVal) => {
  if (isArray(destVal) && isArray(srcVal)) {
    return union(destVal, srcVal)
  }
}

const indexJustificationsByRootStatementId = (justifications => {
  let justificationsByRootStatementId = groupBy(justifications, j => j.rootStatementId)
  justificationsByRootStatementId = mapValues(justificationsByRootStatementId, (justifications, rootStatementId) => map(justifications, j => j.id))
  // for (let statementId of Object.keys(justificationsByRootStatementId)) {
  //   justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => j.id)
  //   // justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => normalize(j, justificationSchema).results)
  // }
  return justificationsByRootStatementId
})

const defaultNewJustification = ({rootStatementId, targetType, targetId}) => ({
  rootStatementId: rootStatementId,
  polarity: JustificationPolarity.POSITIVE,
  target: {
    type: targetType,
    entity: {
      id: targetId
    }
  },
  basis: {
    type: JustificationBasisType.STATEMENT,
    // Store both these types directly on the basis for the view-model
    // Before the justification is sent to the server, the one corresponding to the current type should be put on the
    // entity property
    citationReference: {
      citation: {
        text: '',
      },
      quote: '',
      urls: [{url: ''}],
    },
    statement: {
      text: ''
    }
  }
})

export const entities = (state = {
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
        justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, unionArraysCustomizer),
        quotes: merge({}, state.quotes, action.payload.entities.quotes),
      }

    case CREATE_STATEMENT_SUCCESS: {
      return {
        ...state,
        statements: merge({}, state.statements, action.payload.entities.statements),
      }
    }
    case DELETE_STATEMENT_SUCCESS: {
      return {
        ...state,
        statements: pickBy(state.statements, (s, id) => +id !== action.meta.deletedEntity.id )
      }
    }
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      return {
        ...state,
        statements: pickBy(state.statements, (s, id) => +id !== action.meta.statementId)
      }

    case CREATE_JUSTIFICATION_SUCCESS: {
      const justificationsByRootStatementId = indexJustificationsByRootStatementId(action.payload.entities.justifications)
      return mergeWith(
          {},
          state,
          action.payload.entities,
          {justificationsByRootStatementId},
          unionArraysCustomizer
          )
      // return {
      //   ...state,
      //   statements: merge({}, state.statements, action.payload.entities.statements),
      //   justifications: merge({}, state.justifications, action.payload.entities.justifications),
      //   justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, mergeArraysCustomizer)
      // }
    }
    case DELETE_JUSTIFICATION_SUCCESS: {
      const justification = action.meta.deletedEntity
      const justificationsByRootStatementId = cloneDeep(state.justificationsByRootStatementId)
      justificationsByRootStatementId[justification.rootStatementId] =
          filter(justificationsByRootStatementId[justification.rootStatementId], id => id !== justification.id)
      return {
        ...state,
        justifications: pickBy(state.justifications, (j, id) => +id !== justification.id ),
        justificationsByRootStatementId
      }
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

const loginErrorMessage = (status) => {
  switch (status) {
    case 400:
      return 'Invalid credentials'
    case 403:
      return 'Incorrect password'
    case 404:
      return 'Email does not exist'
    default:
      return 'Unable to complete login at this time'
  }
}

const loginPage = (state = {isLoggingIn: false, errorMessage: '', credentials: {email: '', password: ''}}, action) => {
  switch (action.type) {
    case LOGIN:
      return merge({}, state, {isLoggingIn: true, credentials: action.payload.credentials })
    case LOGIN_SUCCESS:
      return merge({}, state, {isLoggingIn: false, credentials: {email: '', password: ''}})
    case LOGIN_FAILURE:
      return merge({}, state, {isLoggingIn: false, errorMessage: loginErrorMessage(action.payload.status)})
    case LOGIN_CREDENTIAL_CHANGE:
      return merge({}, state, {errorMessage: '', credentials: action.payload})
    case LOCATION_CHANGE:
      // If the user navigates anywhere other than the login page, clear any credentials
      if (action.payload.pathname !== paths.login) {
        return {...state, credentials: {email: '', password: ''}}
      }
      break;
  }

  return state
}

const statementJustificationsPage = (state = {
  isFetching: false,
  didFail: false,
  isNewJustificationDialogVisible: false,
  newJustification: null,
  newJustificationErrorMessage: '',
}, action) => {
  switch (action.type) {
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      return {...state, isFetching: false, didFail: true}
    case FETCH_STATEMENT_JUSTIFICATIONS:
      return {...state, isFetching: true, didFail: false}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      return {...state, isFetching: false}

    case SHOW_ADD_NEW_JUSTIFICATION:
      const rootStatementId = action.payload.statementId
      const targetId = action.payload.statementId
      const targetType = JustificationTargetType.STATEMENT
      return {
        ...state,
        isNewJustificationDialogVisible: true,
        newJustification: defaultNewJustification({rootStatementId, targetType,  targetId}),
        newJustificationErrorMessage: '',
      }
    case HIDE_ADD_NEW_JUSTIFICATION:
      return {...state, isNewJustificationDialogVisible: false, newJustificationErrorMessage: ''}
    case RESET_NEW_JUSTIFICATION:
      return {...state, newJustification: defaultNewJustification({}), newJustificationErrorMessage: ''}

    case CREATE_JUSTIFICATION_FAILURE:
      return {...state, newJustificationErrorMessage: text(CREATE_JUSTIFICATION_FAILURE_MESSAGE)}

    case NEW_JUSTIFICATION_PROPERTY_CHANGE: {
      const newJustification = cloneDeep(state.newJustification)
      const properties = action.payload
      forEach(properties, (val, key) => {
        set(newJustification, key, val)
      })
      return {...state, newJustification, newJustificationErrorMessage: ''}
    }

    case ADD_NEW_JUSTIFICATION_URL: {
      const newJustification = cloneDeep(state.newJustification)
      newJustification.basis.citationReference.urls = newJustification.basis.citationReference.urls.concat([{url: ''}])
      return {
        ...state,
        newJustification,
      }
    }

    case DELETE_NEW_JUSTIFICATION_URL: {
      const newJustification = cloneDeep(state.newJustification)
      console.log(newJustification.basis.citationReference.urls)
      console.log(action.payload)
      newJustification.basis.citationReference.urls.splice(action.payload.index, 1)
      return {
        ...state,
        newJustification,
      }
    }
  }

  return state
}

const createStatementPage = (state = {statement: {text:''}, isCreating: false, didFail: false}, action) => {
  switch (action.type) {
    case CREATE_STATEMENT_PROPERTY_CHANGE:
      const statement = merge({}, state.statement, action.payload)
      return merge({}, state, {statement})
    case CREATE_STATEMENT:
      return merge({}, state, {isCreating: true, didFail: false})
    case CREATE_STATEMENT_SUCCESS:
      return merge({}, state, {statement: {text: ''}, isCreating: false, didFail: false})
    case CREATE_STATEMENT_FAILURE:
      return merge({}, state, {isCreating: false, didFail: true})
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

const app = (state = { loginRedirectLocation: null }, action) => {
  switch (action.type) {
    case LOGIN_REDIRECT:
      // When we redirect to the login page, store the previous location
      return {...state, loginRedirectLocation: action.payload.routerLocation}
    case LOCATION_CHANGE:
      // If the user navigates anywhere other than the login page, clear any login redirection
      if (action.payload.pathname !== paths.login) {
        return {...state, loginRedirectLocation: null}
      }
      break;
  }

  return state
}

const ui = combineReducers({
  loginPage,
  statementJustificationsPage,
  createStatementPage,
  app: appUi,
})

export default combineReducers({
  auth,
  app,
  ui,
  entities,
  router: routerReducer
})