import { combineReducers } from 'redux'
import merge from 'lodash/merge'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import {LOCATION_CHANGE} from 'react-router-redux'
import {
  isCounter,
  JustificationBasisType,
  JustificationPolarity,
  JustificationTargetType,
} from '../models'
import paths from '../paths'

import {
  FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS,
  FETCH_STATEMENT_JUSTIFICATIONS_FAILURE,
  LOGIN_SUCCESS,
  LOGIN, LOGIN_FAILURE, LOGIN_CREDENTIAL_CHANGE, SHOW_NAV_DRAWER, HIDE_NAV_DRAWER,
  TOGGLE_NAV_DRAWER_VISIBILITY, SET_NAV_DRAWER_VISIBILITY, ADD_TOAST, DISMISS_TOAST, FETCH_STATEMENT_JUSTIFICATIONS,
  ADD_NEW_COUNTER_JUSTIFICATION,
  NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE, CANCEL_NEW_COUNTER_JUSTIFICATION,
  MAIN_SEARCH_TEXT_CHANGE, FETCH_STATEMENTS_SEARCH, FETCH_STATEMENTS_SEARCH_SUCCESS,
  FETCH_STATEMENTS_SEARCH_FAILURE, CLEAR_MAIN_SEARCH_AUTOCOMPLETE, FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS,
  EDIT_STATEMENT_PROPERTY_CHANGE, CREATE_STATEMENT, CREATE_STATEMENT_SUCCESS,
  CREATE_STATEMENT_FAILURE, EDIT_JUSTIFICATION_DELETE_URL, EDIT_JUSTIFICATION_ADD_URL,
  EDIT_JUSTIFICATION_PROPERTY_CHANGE,
  CREATE_JUSTIFICATION_SUCCESS, SHOW_NEW_JUSTIFICATION_DIALOG, HIDE_NEW_JUSTIFICATION_DIALOG, RESET_EDIT_JUSTIFICATION,
  CREATE_JUSTIFICATION, CREATE_JUSTIFICATION_FAILURE,
  FETCH_STATEMENT_FOR_EDIT, FETCH_STATEMENT_FOR_EDIT_SUCCESS, FETCH_STATEMENT_FOR_EDIT_FAILURE,
  UPDATE_STATEMENT, UPDATE_STATEMENT_SUCCESS, UPDATE_STATEMENT_FAILURE, CREATE_STATEMENT_JUSTIFICATION_SUCCESS,
  CREATE_STATEMENT_JUSTIFICATION, CREATE_STATEMENT_JUSTIFICATION_FAILURE,
} from '../actions'
import text, {CREATE_JUSTIFICATION_FAILURE_MESSAGE} from "../texts";
import mainSearcher from '../mainSearcher'
import { makeNewJustification } from '../models'
import { editStatementJustificationPageJustificationEditorId, statementJustificationsPageJustificationEditorId } from '../editorIds'
import {statementSchema} from "../schemas";
import {denormalize} from "normalizr";
import {activityKeys, makeMessage} from "../messages";


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

const makeNewCounterJustification = targetJustification => ({
  rootStatementId: targetJustification.rootStatementId,
  target: {
    type: JustificationTargetType.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisType.STATEMENT,
    entity: {text: ''}
  },
  polarity: JustificationPolarity.NEGATIVE
})

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
  // i.e. newRootJustification
  newJustification: null,
  newJustificationErrorMessage: '',
  newCounterJustificationsByTargetId: {},
  newCounterJustificationIsCreatingByTargetId: {},
}, action) => {
  switch (action.type) {
    case FETCH_STATEMENT_JUSTIFICATIONS_FAILURE:
      return {...state, isFetching: false, didFail: true}
    case FETCH_STATEMENT_JUSTIFICATIONS:
      return {...state, isFetching: true, didFail: false}
    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      return {...state, isFetching: false}

    case SHOW_NEW_JUSTIFICATION_DIALOG:
      const rootStatementId = action.payload.statementId
      const targetId = action.payload.statementId
      const targetType = JustificationTargetType.STATEMENT
      return {
        ...state,
        isNewJustificationDialogVisible: true,
        newJustification: makeNewJustification({ rootStatementId, target: { type: targetType, entity: { id: targetId } } }),
        newJustificationErrorMessage: '',
      }
    case HIDE_NEW_JUSTIFICATION_DIALOG:
      return {...state, isNewJustificationDialogVisible: false, newJustificationErrorMessage: ''}
    case RESET_EDIT_JUSTIFICATION:
      return {...state, newJustification: makeNewJustification(), newJustificationErrorMessage: ''}

    case CREATE_JUSTIFICATION: {
      const justification = action.payload.justification

      // If it's a counter-justification, update the creating state
      let newCounterJustificationIsCreatingByTargetId = state.newCounterJustificationIsCreatingByTargetId
      if (isCounter(justification)) {
        const targetJustificationId = justification.target.entity.id
        newCounterJustificationIsCreatingByTargetId = merge(newCounterJustificationIsCreatingByTargetId, {
          [targetJustificationId]: true
        })
      }
      return {
        ...state,
        newCounterJustificationIsCreatingByTargetId,
      }
    }
    case CREATE_JUSTIFICATION_SUCCESS: {
      const justification = action.payload.entities.justifications[action.payload.result.justification]

      // If we just created a counter justification, ensure that it is no longer editing
      let newCounterJustificationsByTargetId = state.newCounterJustificationsByTargetId
      if (isCounter(justification)) {
        const targetJustificationId = justification.target.entity.id
        newCounterJustificationsByTargetId = merge(state.newCounterJustificationsByTargetId, {
          [targetJustificationId]: null
        })
      }
      return {
        ...state,
        newCounterJustificationsByTargetId,
      }
    }
    case CREATE_JUSTIFICATION_FAILURE:
      return {...state, newJustificationErrorMessage: text(CREATE_JUSTIFICATION_FAILURE_MESSAGE)}

    case ADD_NEW_COUNTER_JUSTIFICATION: {
      const targetJustification = action.payload.targetJustification
      const newCounterJustification = makeNewCounterJustification(targetJustification)
      return {
        ...state,
        newCounterJustificationsByTargetId: merge(state.newCounterJustificationsByTargetId, {
          [targetJustification.id]: newCounterJustification
        }),
      }
    }
    case NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE: {
      const {justification, properties} = action.payload
      const targetJustificationId = justification.target.entity.id
      const newCounterJustification = cloneDeep(state.newCounterJustificationsByTargetId[targetJustificationId])
      forEach(properties, (val, key) => {
        set(newCounterJustification, key, val)
      })
      return {
        ...state,
        newCounterJustificationsByTargetId: merge(state.newCounterJustificationsByTargetId, {
          [targetJustificationId]: newCounterJustification
        }),
      }
    }
    case CANCEL_NEW_COUNTER_JUSTIFICATION: {
      const justification = action.payload.justification
      const targetJustificationId = justification.target.entity.id
      return {
        ...state,
        newCounterJustificationsByTargetId: merge(state.newCounterJustificationsByTargetId, {
          [targetJustificationId]: null
        }),
      }
    }
  }

  const newJustification = justificationEditor(statementJustificationsPageJustificationEditorId, state.newJustification, action)
  if (newJustification) {
    return {...state, newJustification, newJustificationErrorMessage: ''}
  }

  return state
}

const editStatementJustificationPage = (state = {
  statement: {text:''},
  justification: makeNewJustification({
    target: {
      type: JustificationTargetType.STATEMENT
    }
  }),
  message: '',
  errorMessage: '',
  inProgress: false,
}, action) => {
  switch (action.type) {

    case FETCH_STATEMENT_FOR_EDIT:
      return {...state, inProgress: true, errorMessage: ''}
    case FETCH_STATEMENT_FOR_EDIT_SUCCESS: {
      // Should be denormalized here once rather than in mapStateToProps where it would be overwritten from entities when any props changed
      // We want edits to stick with it until the user confirms the update.
      const statement = denormalize(action.payload.entities.statements[action.payload.result.statement], statementSchema, action.payload.entities)
      return {...state, statement, inProgress: false}
    }
    case FETCH_STATEMENT_FOR_EDIT_FAILURE: {
      const errorMessage = makeMessage(activityKeys.FETCH_STATEMENT, action.payload)
      return {...state, inProgress: false, errorMessage}
    }
    case EDIT_STATEMENT_PROPERTY_CHANGE: {
      const {editorId, properties} = action.payload
      const statement = cloneDeep(state.statement)
      forEach(properties, (val, key) => {
        set(statement, key, val)
      })
      return {...state, statement}
    }

    case UPDATE_STATEMENT: {
      return {...state, inProgress: true, errorMessage: ''}
    }
    case UPDATE_STATEMENT_SUCCESS: {
      return {...state, inProgress: false, errorMessage: ''}
    }
    case UPDATE_STATEMENT_FAILURE: {
      const errorMessage = makeMessage(activityKeys.UPDATE_STATEMENT, action.payload)
      return {...state, inProgress: false, errorMessage}
    }

    case CREATE_STATEMENT:
    case CREATE_STATEMENT_JUSTIFICATION:
      return {...state, inProgress: true, errorMessage: ''}
    case CREATE_STATEMENT_SUCCESS:
    case CREATE_STATEMENT_JUSTIFICATION_SUCCESS: {
      const statement = {text: ''}
      const justification = makeNewJustification({
        target: {
          type: JustificationTargetType.STATEMENT
        }
      })
      return {...state, statement, justification, inProgress: false, errorMessage: ''}
    }
    case CREATE_STATEMENT_FAILURE:
    case CREATE_STATEMENT_JUSTIFICATION_FAILURE: {
      const errorMessage = makeMessage(activityKeys.CREATE_STATEMENT, action.payload)
      return {...state, inProgress: false, errorMessage}
    }
  }

  const justification = justificationEditor(editStatementJustificationPageJustificationEditorId, state.justification, action)
  if (justification) {
    return {...state, justification}
  }

  return state
}

const justificationEditor = (editorId, justification, action) => {
  if (!action.payload || editorId !== action.payload.justificationEditorId) {
    return null
  }

  switch (action.type) {
    case EDIT_JUSTIFICATION_PROPERTY_CHANGE: {
      const editJustification = cloneDeep(justification)
      const properties = action.payload.properties
      forEach(properties, (val, key) => {
        set(editJustification, key, val)
      })
      return editJustification
    }
    case EDIT_JUSTIFICATION_ADD_URL: {
      const editJustification = cloneDeep(justification)
      editJustification.basis.citationReference.urls = editJustification.basis.citationReference.urls.concat([{url: ''}])
      return editJustification
    }
    case EDIT_JUSTIFICATION_DELETE_URL: {
      const editJustification = cloneDeep(justification)
      editJustification.basis.citationReference.urls.splice(action.payload.index, 1)
      return editJustification
    }
  }

  return null
}

export const appUi = (state = {isNavDrawerVisible: false, toasts: []}, action) => {
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

export const mainSearch = (state = {mainSearchText: '', autocompleteResults: []}, action) => {
  switch (action.type) {

    case MAIN_SEARCH_TEXT_CHANGE:
      return {...state, mainSearchText: action.payload}
    case LOCATION_CHANGE:
      if (!mainSearcher.isSearch(action.payload)) {
        return {...state, mainSearchText: ''}
      }
      break;
    case FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS:
      const autocompleteResults = action.payload.result.map(id => action.payload.entities.statements[id])
      return {...state, autocompleteResults}
    case CLEAR_MAIN_SEARCH_AUTOCOMPLETE:
      return {...state, autocompleteResults: []}
  }

  return state
}

const mainSearchPage = (state = { isFetching: false, statements: [] }, action) => {
  switch (action.type) {
    case FETCH_STATEMENTS_SEARCH:
      return {...state, isFetching: true}
    case FETCH_STATEMENTS_SEARCH_SUCCESS:
      const statements = action.payload.result.map(id => action.payload.entities.statements[id])
      return {...state, isFetching: false, statements: statements || []}
    case FETCH_STATEMENTS_SEARCH_FAILURE:
      return {...state, isFetching: false}
  }
  return state
}



export default combineReducers({
  loginPage,
  statementJustificationsPage,
  editStatementJustificationPage,
  mainSearchPage,
  app: appUi,
  mainSearch,
})