import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import isArray from 'lodash/isArray'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'
import groupBy from 'lodash/groupBy'
import pickBy from 'lodash/pickBy'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import values from 'lodash/values'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import clone from 'lodash/clone'
import set from 'lodash/set'
import filter from 'lodash/filter'
import union from 'lodash/union'
import isNumber from 'lodash/isNumber'
import toNumber from 'lodash/toNumber'
import {LOCATION_CHANGE} from 'react-router-redux'
import {
  isCounter,
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
  UN_DISVERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION_SUCCESS, LOGIN_REDIRECT, DELETE_STATEMENT_SUCCESS,
  DELETE_JUSTIFICATION_SUCCESS, ADD_NEW_COUNTER_JUSTIFICATION,
  NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE, CANCEL_NEW_COUNTER_JUSTIFICATION,
  MAIN_SEARCH_TEXT_CHANGE, FETCH_STATEMENTS_SEARCH, FETCH_STATEMENTS_SEARCH_SUCCESS,
  FETCH_STATEMENTS_SEARCH_FAILURE, CLEAR_MAIN_SEARCH_AUTOCOMPLETE, FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS,
  FETCH_STATEMENT_SUGGESTIONS_SUCCESS, EDIT_STATEMENT_PROPERTY_CHANGE, CREATE_STATEMENT, CREATE_STATEMENT_SUCCESS,
  CREATE_STATEMENT_FAILURE, EDIT_JUSTIFICATION_DELETE_URL, EDIT_JUSTIFICATION_ADD_URL,
  EDIT_JUSTIFICATION_PROPERTY_CHANGE,
  CREATE_JUSTIFICATION_SUCCESS, SHOW_NEW_JUSTIFICATION_DIALOG, HIDE_NEW_JUSTIFICATION_DIALOG, RESET_EDIT_JUSTIFICATION,
  CREATE_JUSTIFICATION, CREATE_JUSTIFICATION_FAILURE,
  FETCH_STATEMENT_FOR_EDIT, FETCH_STATEMENT_FOR_EDIT_SUCCESS, FETCH_STATEMENT_FOR_EDIT_FAILURE, FETCH_STATEMENT_SUCCESS,
  UPDATE_STATEMENT, UPDATE_STATEMENT_SUCCESS, UPDATE_STATEMENT_FAILURE,
} from './actions'
import text, {CREATE_JUSTIFICATION_FAILURE_MESSAGE} from "./texts";
import mainSearcher from './mainSearcher'
import { makeNewJustification } from './models'
import { editStatementPageJustificationEditorId, statementJustificationsPageJustificationEditorId } from './editorIds'
import {statementSchema} from "./schemas";
import {denormalize} from "normalizr";
import {activityKeys, makeMessage} from "./messages";

export const unionArraysDistinctIdsCustomizer = (destVal, srcVal) => {
  if (isArray(destVal) && isArray(srcVal)) {
    // For values that have IDs, overwrite dest values
    const seenDestIdIndices = {}
    const seenSrcIdIndices = {}
    const filteredDestVals = []
    const filteredSrcVals = []
    forEach(destVal, val => {
      if (val && val.id) {
        if (!isNumber(seenDestIdIndices[val.id])) {
          filteredDestVals.push(val)
          seenDestIdIndices[val.id] = filteredDestVals.length - 1
        } else {
          filteredDestVals[seenDestIdIndices[val.id]] = val
        }
      } else {
        // If the value lacks an ID, just merge it
        filteredDestVals.push(val)
      }
    })

    forEach(srcVal, val => {
      if (val && val.id && isNumber(seenDestIdIndices[val.id])) {
        // Overwrite dest items having the same ID
        filteredDestVals[seenDestIdIndices[val.id]] = val
      } else if (val && val.id && isNumber(seenSrcIdIndices[val.id])) {
        filteredSrcVals[seenSrcIdIndices[val.id]] = val
      } else if (val && val.id) {
        filteredSrcVals.push(val)
        seenSrcIdIndices[val.id] = filteredSrcVals.length - 1
      } else {
        // If the value lacks an ID, just merge it
        filteredSrcVals.push(val)
      }
    })
    return union(filteredDestVals, filteredSrcVals)
  }
  return undefined // tells lodash to use its default method
}

export const indexRootJustificationsByRootStatementId = justificationsById => {
  const justifications = values(justificationsById)
  const rootJustifications = filter(justifications, j =>
    // TODO do we need a more thorough approach to ensuring that only fully entities are present? I'd like to send/receive them as stubs, and denormalize them somewhere standard
    // Some justifications that come back are stubs and will lack relations like .target
    j.target &&
    j.target.type === JustificationTargetType.STATEMENT &&
    j.target.entity.id === j.rootStatementId
  )
  let rootJustificationsByRootStatementId = groupBy(rootJustifications, j => j.rootStatementId)
  rootJustificationsByRootStatementId = mapValues(rootJustificationsByRootStatementId, (justifications, rootStatementId) => map(justifications, j => j.id))
  // for (let statementId of Object.keys(justificationsByRootStatementId)) {
  //   justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => j.id)
  //   // justificationsByRootStatementId[statementId] = map(justificationsByRootStatementId[statementId], j => normalize(j, justificationSchema).result)
  // }
  return rootJustificationsByRootStatementId
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

    case FETCH_STATEMENT_SUCCESS:
      return {...state, statements: merge(state.statements, action.payload.entities.statements)}

    case FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS:
      const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)
      return {
        ...state,
        statements: merge({}, state.statements, action.payload.entities.statements),
        justifications: merge({}, state.justifications, action.payload.entities.justifications),
        votes: merge({}, state.votes, action.payload.entities.votes),
        justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, unionArraysDistinctIdsCustomizer),
        quotes: merge({}, state.quotes, action.payload.entities.quotes),
      }

    case CREATE_STATEMENT_SUCCESS: {
      return {
        ...state,
        statements: {...state.statements, ...action.payload.entities.statements},
        justifications: {...state.justifications, ...action.payload.entities.justifications},
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
      const justificationsByRootStatementId = indexRootJustificationsByRootStatementId(action.payload.entities.justifications)

      // if counter, add to counter justifications
      const justificationId = action.payload.result.justification
      const justification = action.payload.entities.justifications[justificationId]
      let counteredJustifications = {}
      if (isCounter(justification)) {
        const counteredJustification = state.justifications[justification.target.entity.id]
        counteredJustification.counterJustifications = counteredJustification.counterJustifications ?
            counteredJustification.counterJustifications.concat([justification.id]) :
            [justification.id]
        counteredJustifications = {justifications: { [counteredJustification.id]: counteredJustification }}
      }

      return mergeWith(
          {},
          state,
          action.payload.entities,
          counteredJustifications,
          {justificationsByRootStatementId},
          unionArraysDistinctIdsCustomizer,
        )
      // return {
      //   ...state,
      //   statements: merge({}, state.statements, action.payload.entities.statements),
      //   justifications: merge({}, state.justifications, action.payload.entities.justifications),
      //   justificationsByRootStatementId: mergeWith({}, state.justificationsByRootStatementId, justificationsByRootStatementId, mergeArraysCustomizer)
      // }
    }
    case DELETE_JUSTIFICATION_SUCCESS: {
      const deletedJustification = action.meta.deletedEntity
      const justificationsByRootStatementId = cloneDeep(state.justificationsByRootStatementId)
      justificationsByRootStatementId[deletedJustification.rootStatementId] =
          filter(justificationsByRootStatementId[deletedJustification.rootStatementId], id => id !== deletedJustification.id)

      // If the deleted justification was a counter-justification, remove it from the target justification's counterJustifications
      let justifications = state.justifications
      if (isCounter(deletedJustification)) {
        const counteredJustificationId = toNumber(deletedJustification.target.entity.id)
        let counteredJustification = justifications[counteredJustificationId]
        counteredJustification = cloneDeep(counteredJustification)
        counteredJustification.counterJustifications = filter(counteredJustification.counterJustifications, cjId => cjId !== deletedJustification.id)
        justifications = clone(justifications)
        justifications[counteredJustificationId] = counteredJustification
      }

      return {
        ...state,
        justifications: pickBy(justifications, (j, id) => +id !== deletedJustification.id ),
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

    case FETCH_STATEMENT_SUGGESTIONS_SUCCESS:
      return {
          ...state,
          statements: {
            ...state.statements,
            ...action.payload.entities.statements,
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

const editStatementPage = (state = {
  statement: {text:''},
  newJustification: makeNewJustification({
    target: {
      type: JustificationTargetType.STATEMENT
    }
  }),
  message: '',
  errorMessage: '',
  inProgress: false,
  statementTextAutocompleteResults: [],
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
      return {...state, inProgress: true, errorMessage: ''}
    case CREATE_STATEMENT_SUCCESS: {
      const statement = {text: ''}
      const newJustification = makeNewJustification({
        target: {
          type: JustificationTargetType.STATEMENT
        }
      })
      return {...state, statement, newJustification, inProgress: false, errorMessage: ''}
    }
    case CREATE_STATEMENT_FAILURE: {
      const errorMessage = makeMessage(activityKeys.CREATE_STATEMENT, action.payload)
      return {...state, inProgress: false, errorMessage}
    }
  }

  const newJustification = justificationEditor(editStatementPageJustificationEditorId, state.newJustification, action)
  if (newJustification) {
    return {...state, newJustification, newJustificationErrorMessage: ''}
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

const app = (state = { loginRedirectLocation: null, statementSuggestions: {} }, action) => {
  switch (action.type) {
    case LOGIN_REDIRECT:
      // When we redirect to the login page, store the previous location
      return {...state, loginRedirectLocation: action.payload.routerLocation}
    case LOCATION_CHANGE:
      // If the user navigates anywhere other than the login page, clear any login redirection
      if (action.payload.pathname !== paths.login()) {
        return {...state, loginRedirectLocation: null}
      }
      break;
    case FETCH_STATEMENT_SUGGESTIONS_SUCCESS:
      return {
        ...state,
        statementSuggestions: {
          ...state.statementSuggestions,
          ...{ [action.meta.suggestionsKey]: action.payload.result}
        }
      }
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

const ui = combineReducers({
  loginPage,
  statementJustificationsPage,
  editStatementPage,
  mainSearchPage,
  app: appUi,
  mainSearch,
})

export default combineReducers({
  auth,
  app,
  ui,
  entities,
  router: routerReducer
})