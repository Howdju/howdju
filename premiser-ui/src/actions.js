import { createAction as create2Action } from 'redux-actions';

export const FETCH_STATEMENTS = 'FETCH_STATEMENTS'
export const FETCH_STATEMENTS_SUCCESS = 'FETCH_STATEMENTS_SUCCESS'
export const FETCH_STATEMENTS_FAILURE = 'FETCH_STATEMENTS_FAILURE'
export const fetchStatements = create2Action(FETCH_STATEMENTS)

export const FETCH_STATEMENT_JUSTIFICATIONS = 'FETCH_STATEMENT_JUSTIFICATIONS'
export const FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS = 'FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS'
export const FETCH_STATEMENT_JUSTIFICATIONS_FAILURE = 'FETCH_STATEMENT_JUSTIFICATIONS_FAILURE'
export const fetchStatementJustifications = create2Action(FETCH_STATEMENT_JUSTIFICATIONS, statementId => ({statementId}))

export const ACCEPT_JUSTIFICATION = 'ACCEPT_JUSTIFICATION'
export const acceptJustification = create2Action(ACCEPT_JUSTIFICATION)
export const REJECT_JUSTIFICATION = 'REJECT_JUSTIFICATION'
export const rejectJustification = create2Action(REJECT_JUSTIFICATION)

export const CALL_API = 'CALL_API'
export const CALL_API_SUCCESS = 'CALL_API_SUCCESS'
export const CALL_API_FAILURE = 'CALL_API_FAILURE'

export const LOGIN = 'LOGIN'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const LOGIN_FAILURE = 'LOGIN_FAILURE'
export const login = create2Action(LOGIN)

export const LOGIN_CREDENTIAL_CHANGE = 'LOGIN_CREDENTIAL_CHANGE'
export const loginCredentialChange = create2Action(LOGIN_CREDENTIAL_CHANGE)

export const LOGOUT = 'LOGOUT'
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE'
export const logout = create2Action(LOGOUT)

export const LOGIN_REDIRECT = 'LOGIN_REDIRECT'

export const API_RESOURCE_ACTIONS = {
  [FETCH_STATEMENTS]: {
    SUCCESS: FETCH_STATEMENTS_SUCCESS,
    FAILURE: FETCH_STATEMENTS_FAILURE
  }
}

export const SHOW_NAV_DRAWER = 'SHOW_NAV_DRAWER'
export const HIDE_NAV_DRAWER = 'HIDE_NAV_DRAWER'
export const TOGGLE_NAV_DRAWER_VISIBILITY = 'TOGGLE_NAV_DRAWER_VISIBILITY'
export const SET_NAV_DRAWER_VISIBILITY = 'SET_NAV_DRAWER_VISIBILITY'
export const showNavDrawer = create2Action(SHOW_NAV_DRAWER)
export const hideNavDrawer = create2Action(HIDE_NAV_DRAWER)
export const toggleNavDrawerVisibility = create2Action(TOGGLE_NAV_DRAWER_VISIBILITY)
export const setNavDrawerVisibility = create2Action(SET_NAV_DRAWER_VISIBILITY)

export const ADD_TOAST = 'ADD_TOAST'
export const DISMISS_TOAST = 'DISMISS_TOAST'
export const addToast = create2Action(ADD_TOAST)
export const dismissToast = create2Action(DISMISS_TOAST)


export const VERIFY_JUSTIFICATION = 'VERIFY_JUSTIFICATION'
export const VERIFY_JUSTIFICATION_SUCCESS = 'VERIFY_JUSTIFICATION_SUCCESS'
export const VERIFY_JUSTIFICATION_FAILURE = 'VERIFY_JUSTIFICATION_FAILURE'
export const verifyJustification = create2Action(VERIFY_JUSTIFICATION, target => ({target}))

export const UN_VERIFY_JUSTIFICATION = 'UN_VERIFY_JUSTIFICATION'
export const UN_VERIFY_JUSTIFICATION_SUCCESS = 'UN_VERIFY_JUSTIFICATION_SUCCESS'
export const UN_VERIFY_JUSTIFICATION_FAILURE = 'UN_VERIFY_JUSTIFICATION_FAILURE'
export const unVerifyJustification = create2Action(UN_VERIFY_JUSTIFICATION, target => ({target}))

export const DISVERIFY_JUSTIFICATION = 'DISVERIFY_JUSTIFICATION'
export const DISVERIFY_JUSTIFICATION_SUCCESS = 'DISVERIFY_JUSTIFICATION_SUCCESS'
export const DISVERIFY_JUSTIFICATION_FAILURE = 'DISVERIFY_JUSTIFICATION_FAILURE'
export const disverifyJustification = create2Action(DISVERIFY_JUSTIFICATION, target => ({target}))

export const UN_DISVERIFY_JUSTIFICATION = 'UN_DISVERIFY_JUSTIFICATION'
export const UN_DISVERIFY_JUSTIFICATION_SUCCESS = 'UN_DISVERIFY_JUSTIFICATION_SUCCESS'
export const UN_DISVERIFY_JUSTIFICATION_FAILURE = 'UN_DISVERIFY_JUSTIFICATION_FAILURE'
export const unDisverifyJustification = create2Action(UN_DISVERIFY_JUSTIFICATION, target => ({target}))

export const CREATE_STATEMENT_PROPERTY_CHANGE = 'CREATE_STATEMENT_PROPERTY_CHANGE'
export const createStatementPropertyChange = create2Action(CREATE_STATEMENT_PROPERTY_CHANGE)
export const CREATE_STATEMENT = 'CREATE_STATEMENT'
export const CREATE_STATEMENT_SUCCESS = 'CREATE_STATEMENT_SUCCESS'
export const CREATE_STATEMENT_FAILURE = 'CREATE_STATEMENT_FAILURE'
export const createStatement = create2Action(CREATE_STATEMENT, statement => ({statement}))

export const DELETE_STATEMENT = 'DELETE_STATEMENT'
export const DELETE_STATEMENT_SUCCESS = 'DELETE_STATEMENT_SUCCESS'
export const DELETE_STATEMENT_FAILURE = 'DELETE_STATEMENT_FAILURE'
export const deleteStatement = create2Action(DELETE_STATEMENT, statement => ({statement}))

export const CREATE_JUSTIFICATION = 'CREATE_JUSTIFICATION'
export const CREATE_JUSTIFICATION_SUCCESS = 'CREATE_JUSTIFICATION_SUCCESS'
export const CREATE_JUSTIFICATION_FAILURE = 'CREATE_JUSTIFICATION_FAILURE'
export const createJustification = create2Action(CREATE_JUSTIFICATION, justification => {
  if (justification.target.entity.id) {
    // If the target already has an ID, then just sent that along; that is enough for the server to identify it.
    // This transformation probably applies to basis and any other entities.  But it is particularly important for
    // justification targets, because the target may be a justification having circular references.
    justification = {...justification, target:{...justification.target, entity: { id: justification.target.entity.id}}}
  }
  return {justification}
})

/** For a singleton on the Statemeent Justifications page; be careful if using multiple editors at once! */
export const SHOW_ADD_NEW_JUSTIFICATION = 'SHOW_ADD_NEW_JUSTIFICATION'
export const HIDE_ADD_NEW_JUSTIFICATION = 'HIDE_ADD_NEW_JUSTIFICATION'
export const NEW_JUSTIFICATION_PROPERTY_CHANGE = 'NEW_JUSTIFICATION_PROPERTY_CHANGE'
export const RESET_NEW_JUSTIFICATION = 'RESET_NEW_JUSTIFICATION'
export const showAddNewJustification = create2Action(SHOW_ADD_NEW_JUSTIFICATION, statementId => ({statementId}))
export const hideAddNewJustification = create2Action(HIDE_ADD_NEW_JUSTIFICATION)
export const newJustificationPropertyChange = create2Action(NEW_JUSTIFICATION_PROPERTY_CHANGE)
export const resetNewJustification = create2Action(RESET_NEW_JUSTIFICATION)
export const ADD_NEW_JUSTIFICATION_URL = 'ADD_NEW_JUSTIFICATION_URL'
export const addNewJustificationUrl = create2Action(ADD_NEW_JUSTIFICATION_URL)
export const DELETE_NEW_JUSTIFICATION_URL = 'DELETE_NEW_JUSTIFICATION_URL'
export const deleteNewJustificationUrl = create2Action(DELETE_NEW_JUSTIFICATION_URL, (url, index) => ({url, index}))

export const DELETE_JUSTIFICATION = 'DELETE_JUSTIFICATION'
export const DELETE_JUSTIFICATION_SUCCESS = 'DELETE_JUSTIFICATION_SUCCESS'
export const DELETE_JUSTIFICATION_FAILURE = 'DELETE_JUSTIFICATION_FAILURE'
export const deleteJustification = create2Action(DELETE_JUSTIFICATION, justification => ({justification}))

export const ADD_NEW_COUNTER_JUSTIFICATION = 'ADD_NEW_COUNTER_JUSTIFICATION'
export const NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE = 'NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE'
export const CANCEL_NEW_COUNTER_JUSTIFICATION = 'CANCEL_NEW_COUNTER_JUSTIFICATION'
export const addNewCounterJustification = create2Action(ADD_NEW_COUNTER_JUSTIFICATION, targetJustification => ({targetJustification}))
export const newCounterJustificationPropertyChange =
    create2Action(NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE, (justification, properties) => ({justification, properties}))
export const cancelNewCounterJustification = create2Action(CANCEL_NEW_COUNTER_JUSTIFICATION, justification => ({justification}))
