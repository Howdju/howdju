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

export const EDIT_STATEMENT_PROPERTY_CHANGE = 'EDIT_STATEMENT_PROPERTY_CHANGE'
export const editStatementPropertyChange = create2Action(EDIT_STATEMENT_PROPERTY_CHANGE, (editorId, properties) => ({editorId, properties}))
export const CREATE_STATEMENT = 'CREATE_STATEMENT'
export const CREATE_STATEMENT_SUCCESS = 'CREATE_STATEMENT_SUCCESS'
export const CREATE_STATEMENT_FAILURE = 'CREATE_STATEMENT_FAILURE'
export const createStatement = create2Action(CREATE_STATEMENT, (statement, justification) => ({statement, justification}))

export const UPDATE_STATEMENT = 'UPDATE_STATEMENT'
export const UPDATE_STATEMENT_SUCCESS = 'UPDATE_STATEMENT_SUCCESS'
export const UPDATE_STATEMENT_FAILURE = 'UPDATE_STATEMENT_FAILURE'
export const updateStatement = create2Action(UPDATE_STATEMENT, statement => ({statement}))

export const DELETE_STATEMENT = 'DELETE_STATEMENT'
export const DELETE_STATEMENT_SUCCESS = 'DELETE_STATEMENT_SUCCESS'
export const DELETE_STATEMENT_FAILURE = 'DELETE_STATEMENT_FAILURE'
export const deleteStatement = create2Action(DELETE_STATEMENT, statement => ({statement}))

export const CREATE_JUSTIFICATION = 'CREATE_JUSTIFICATION'
export const CREATE_JUSTIFICATION_SUCCESS = 'CREATE_JUSTIFICATION_SUCCESS'
export const CREATE_JUSTIFICATION_FAILURE = 'CREATE_JUSTIFICATION_FAILURE'
export const createJustification = create2Action(CREATE_JUSTIFICATION, justification => {
  if (justification.target.entity.id) {
    // If the target already has an ID, then just send that along; that is enough for the server to identify it.
    // This transformation probably applies to basis and any other entities.  But it is particularly important for
    // justification targets, because the target may be a justification having circular references.
    justification = {...justification, target: {...justification.target, entity: { id: justification.target.entity.id}}}
  }
  return {justification}
})

/** For a singleton on the Statement Justifications page; be careful if using multiple editors at once! */
export const SHOW_NEW_JUSTIFICATION_DIALOG = 'SHOW_NEW_JUSTIFICATION_DIALOG'
export const HIDE_NEW_JUSTIFICATION_DIALOG = 'HIDE_NEW_JUSTIFICATION_DIALOG'
export const showNewJustificationDialog = create2Action(SHOW_NEW_JUSTIFICATION_DIALOG, statementId => ({statementId}))
export const hideNewJustificationDialog = create2Action(HIDE_NEW_JUSTIFICATION_DIALOG)

export const EDIT_JUSTIFICATION_PROPERTY_CHANGE = 'EDIT_JUSTIFICATION_PROPERTY_CHANGE'
export const editJustificationPropertyChange = create2Action(EDIT_JUSTIFICATION_PROPERTY_CHANGE, (justificationEditorId, properties) => ({
  justificationEditorId,
  properties,
}))

export const RESET_EDIT_JUSTIFICATION = 'RESET_EDIT_JUSTIFICATION'
export const resetEditJustification = create2Action(RESET_EDIT_JUSTIFICATION)
export const EDIT_JUSTIFICATION_ADD_URL = 'EDIT_JUSTIFICATION_ADD_URL'
export const editJustificationAddUrl = create2Action(EDIT_JUSTIFICATION_ADD_URL, justificationEditorId => ({justificationEditorId}))
export const EDIT_JUSTIFICATION_DELETE_URL = 'EDIT_JUSTIFICATION_DELETE_URL'
export const editJustificationDeleteUrl = create2Action(EDIT_JUSTIFICATION_DELETE_URL, (justificationEditorId, url, index) => ({justificationEditorId, url, index}))

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

export const MAIN_SEARCH_TEXT_CHANGE = 'MAIN_SEARCH_TEXT_CHANGE'
export const DO_MAIN_SEARCH = 'DO_MAIN_SEARCH'
export const mainSearchTextChange = create2Action(MAIN_SEARCH_TEXT_CHANGE)
export const doMainSearch = create2Action(DO_MAIN_SEARCH, mainSearchText => ({mainSearchText}))

export const FETCH_STATEMENTS_SEARCH = 'FETCH_STATEMENTS_SEARCH'
export const FETCH_STATEMENTS_SEARCH_SUCCESS = 'FETCH_STATEMENTS_SEARCH_SUCCESS'
export const FETCH_STATEMENTS_SEARCH_FAILURE = 'FETCH_STATEMENTS_SEARCH_FAILURE'
export const fetchStatementsSearch = create2Action(FETCH_STATEMENTS_SEARCH, searchText => ({searchText}))

export const INITIALIZE_MAIN_SEARCH = 'INITIALIZE_MAIN_SEARCH'
export const initializeMainSearch = create2Action(INITIALIZE_MAIN_SEARCH, searchText => ({searchText}))

export const FETCH_MAIN_SEARCH_AUTOCOMPLETE = 'FETCH_MAIN_SEARCH_AUTOCOMPLETE'
export const FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS = 'FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS'
export const FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE = 'FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE'
export const fetchMainSearchAutocomplete = create2Action(FETCH_MAIN_SEARCH_AUTOCOMPLETE, searchText => ({searchText}))

export const CLEAR_MAIN_SEARCH_AUTOCOMPLETE = 'CLEAR_MAIN_SEARCH_AUTOCOMPLETE'
export const clearMainSearchAutocomplete = create2Action(CLEAR_MAIN_SEARCH_AUTOCOMPLETE)

export const VIEW_STATEMENT = 'VIEW_STATEMENT'
export const viewStatement = create2Action(VIEW_STATEMENT, statement => ({statement}))

export const FETCH_STATEMENT_SUGGESTIONS = 'FETCH_STATEMENT_SUGGESTIONS'
export const FETCH_STATEMENT_SUGGESTIONS_SUCCESS = 'FETCH_STATEMENT_SUGGESTIONS_SUCCESS'
export const FETCH_STATEMENT_SUGGESTIONS_FAILURE = 'FETCH_STATEMENT_SUGGESTIONS_FAILURE'
export const fetchStatementSuggestions = create2Action(FETCH_STATEMENT_SUGGESTIONS, (text, suggestionsKey) => ({
  text,
  suggestionsKey,
}))

export const FETCH_STATEMENT = 'FETCH_STATEMENT'
export const FETCH_STATEMENT_SUCCESS = 'FETCH_STATEMENT_SUCCESS'
export const FETCH_STATEMENT_FAILURE = 'FETCH_STATEMENT_FAILURE'
export const fetchStatement = create2Action(FETCH_STATEMENT, statementId => ({statementId}))
export const FETCH_STATEMENT_FOR_EDIT = 'FETCH_STATEMENT_FOR_EDIT'
export const FETCH_STATEMENT_FOR_EDIT_SUCCESS = 'FETCH_STATEMENT_FOR_EDIT_SUCCESS'
export const FETCH_STATEMENT_FOR_EDIT_FAILURE = 'FETCH_STATEMENT_FOR_EDIT_FAILURE'
export const fetchStatementForEdit = create2Action(FETCH_STATEMENT_FOR_EDIT, statementId => ({statementId}))

export const DO_EDIT_STATEMENT = 'DO_EDIT_STATEMENT'
export const doEditStatement = create2Action(DO_EDIT_STATEMENT, statementId => ({statementId}))