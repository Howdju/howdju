import { createAction as actionCreator } from 'redux-actions';
import {decircularizeTarget, VotePolarity, VoteTargetType} from "./models";
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import assign from 'lodash/assign'

const actionTypeDelim = '/'

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = ac => ac.toString()

const identity = x => x

/** Helper to easily allow us to pass an object with 'action groups' to redux-react's connect method.
 * Action groups are what we call the objects below with react-actions action creators.  They are just
 * a way to organize related action creators.  The convention with redux-react's connect method's mapDispatchToProps
 * is to pass an object with keys equal to action creators.  redux-react will automatically turn the action creators
 * into dispatched versions.  This helper accomplishes the same for an object the properties of which are action creator
 * groups like those defined below.
 */
export const mapActionCreatorGroupToDispatchToProps = (actionCreatorGroups, otherActions) => dispatch => {
  const dispatchProps = mapValues(actionCreatorGroups, (actionCreatorGroup) =>
      mapValues(actionCreatorGroup, (actionCreator) =>
          (...args) => dispatch(actionCreator.apply(null, args))
      )
  )

  if (otherActions) {
    assign(dispatchProps, mapValues(otherActions, actionCreator => (...args) => dispatch(actionCreator.apply(null, args))))
  }

  return dispatchProps
}

/** Create an action creator having a property `.response` with another action creator for corresponding API responses */
const apiActionCreator = (...args) => {
  const ac = actionCreator(...args)
  const actionType = args[0]
  ac.response = actionCreator(actionType + actionTypeDelim + 'RESPONSE', identity, (payload, meta) => meta)
  return ac
}

export const app = {
  /** If the query params indicate a main search, initialize the results */
  initializeMainSearch: actionCreator('INITIALIZE_MAIN_SEARCH', searchText => ({searchText})),
}

export const api = {
  callApi: apiActionCreator('CALL_API'),
  fetchStatement: apiActionCreator('FETCH_STATEMENT', statementId => ({statementId})),
  fetchStatements: apiActionCreator('FETCH_STATEMENTS'),
  fetchStatementJustifications: apiActionCreator('FETCH_STATEMENT_JUSTIFICATIONS', statementId => ({statementId})),
  fetchCitationReference: apiActionCreator('FETCH_CITATION_REFERENCE', citationReferenceId => ({citationReferenceId})),
  login: apiActionCreator('LOGIN', credentials => ({credentials})),
  logout: apiActionCreator('LOGOUT'),

  verifyJustification: apiActionCreator('VERIFY_JUSTIFICATION', target => ({
    vote: {
      targetType: VoteTargetType.JUSTIFICATION,
      targetId: target.id,
      polarity: VotePolarity.POSITIVE,
    },
    previousVote: target.vote,
  })),
  unVerifyJustification: apiActionCreator('UN_VERIFY_JUSTIFICATION', target => ({
    vote: {
      targetType: VoteTargetType.JUSTIFICATION,
      targetId: target.id,
      polarity: VotePolarity.POSITIVE,
    },
    previousVote: target.vote,
  })),
  disverifyJustification: apiActionCreator('DISVERIFY_JUSTIFICATION', target => ({
    vote: {
      targetType: VoteTargetType.JUSTIFICATION,
      targetId: target.id,
      polarity: VotePolarity.NEGATIVE,
    },
    previousVote: target.vote,
  })),
  unDisverifyJustification: apiActionCreator('UN_DISVERIFY_JUSTIFICATION', target => ({
    vote: {
      targetType: VoteTargetType.JUSTIFICATION,
      targetId: target.id,
      polarity: VotePolarity.NEGATIVE,
    },
    previousVote: target.vote,
  })),

  createStatement: apiActionCreator('CREATE_STATEMENT', statement => ({statement})),
  createStatementJustification: apiActionCreator('CREATE_STATEMENT_JUSTIFICATION', (statement, justification) =>
      ({statementJustification: {statement, justification}})),
  updateStatement: apiActionCreator('UPDATE_STATEMENT', statement => ({statement}), (s, nonce) => ({nonce})),
  deleteStatement: apiActionCreator('DELETE_STATEMENT', statement => ({statement})),
  fetchStatementTextSuggestions: apiActionCreator('API/FETCH_STATEMENT_TEXT_SUGGESTIONS', (statementText, suggestionsKey) => ({
    statementText,
    suggestionsKey,
  })),
  fetchCitationTextSuggestions: apiActionCreator('API/FETCH_CITATION_TEXT_SUGGESTIONS', (citationText, suggestionsKey) => ({
    citationText,
    suggestionsKey,
  })),
  createJustification: apiActionCreator('CREATE_JUSTIFICATION', justification => ({justification: decircularizeTarget(justification)})),
  updateCitationReference: apiActionCreator('UPDATE_CITATION_REFERENCE', citationReference => ({citationReference})),
  deleteJustification: apiActionCreator('DELETE_JUSTIFICATION', justification => ({justification})),
  fetchStatementsSearch: apiActionCreator('FETCH_STATEMENTS_SEARCH', searchText => ({searchText})),
  fetchMainSearchSuggestions: apiActionCreator('FETCH_MAIN_SEARCH_SUGGESTIONS', (searchText, suggestionsKey) => ({searchText, suggestionsKey})),
}
export const apiActionCreatorsByActionType = reduce(api, (result, actionCreator) => {
  result[actionCreator] = actionCreator
  return result
}, {})

export const ui = {
  showNavDrawer: actionCreator('SHOW_NAV_DRAWER'),
  hideNavDrawer: actionCreator('HIDE_NAV_DRAWER'),
  toggleNavDrawerVisibility: actionCreator('TOGGLE_NAV_DRAWER_VISIBILITY'),
  setNavDrawerVisibility: actionCreator('SET_NAV_DRAWER_VISIBILITY'),
  addToast: actionCreator('ADD_TOAST', text => ({text})),
  dismissToast: actionCreator('DISMISS_TOAST'),

  showNewJustificationDialog: actionCreator('SHOW_NEW_JUSTIFICATION_DIALOG'),
  hideNewJustificationDialog: actionCreator('HIDE_NEW_JUSTIFICATION_DIALOG'),

  addNewCounterJustification: actionCreator('ADD_NEW_COUNTER_JUSTIFICATION', targetJustification => ({targetJustification})),
  newCounterJustificationPropertyChange: actionCreator('NEW_COUNTER_JUSTIFICATION_PROPERTY_CHANGE', (justification, properties) => ({justification, properties})),
  cancelNewCounterJustification: actionCreator('CANCEL_NEW_COUNTER_JUSTIFICATION', justification => ({justification})),

  mainSearchTextChange: actionCreator('MAIN_SEARCH_TEXT_CHANGE'),
  loginCredentialChange: actionCreator('LOGIN_CREDENTIAL_CHANGE'),
}

const commitEdit = actionCreator('EDITORS/COMMIT_EDIT', (editorType, editorId) => ({editorType, editorId}))
commitEdit.result = actionCreator('EDITORS/COMMIT_EDIT' + actionTypeDelim + 'RESULT', (editorType, editorId, result) => ({editorType, editorId, result}))
export const editors = {
  beginEdit: actionCreator('EDITORS/BEGIN_EDIT', (editorType, editorId, entity) => ({editorType, editorId, entity})),
  propertyChange: actionCreator('EDITORS/PROPERTY_CHANGE', (editorType, editorId, properties) => ({editorType, editorId, properties})),
  commitEdit,
  cancelEdit: actionCreator('EDITORS/CANCEL_EDIT', (editorType, editorId) => ({editorType, editorId})),

  resetEditJustification: actionCreator('RESET_EDIT_JUSTIFICATION'),

  addUrl: actionCreator('EDITORS/ADD_URL', (editorType, editorId) => ({editorType, editorId})),
  deleteUrl: actionCreator('EDITORS/DELETE_URL', (editorType, editorId, url, index) => ({
    editorType,
    editorId,
    url,
    index
  })),
}

export const goto = {
  login: actionCreator('GOTO/LOGIN', loginRedirectLocation => ({loginRedirectLocation})),
  statement: actionCreator('GOTO/STATEMENT', statement => ({statement})),
  mainSearch: actionCreator('GOTO/MAIN_SEARCH', mainSearchText => ({mainSearchText})),
  createJustification: actionCreator('GOTO/CREATE_JUSTIFICATION', (basisType, basisId) => ({basisType, basisId}))
}

export const flows = {
  createJustificationThenPutActionIfSuccessful: actionCreator('FLOWS/CREATE_JUSTIFICATION_THEN_PUT_ACTION_IF_SUCCESSFUL',
      (justification, nextAction) => ({justification, nextAction})),
  fetchAndBeginEditOfNewJustificationFromBasis: actionCreator('FLOWS/FETCH_AND_BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_BASIS',
      (editorType, editorId, basisType, basisId) => ({editorType, editorId, basisType, basisId})),
  commitEditThenView: actionCreator('FLOWS/COMMIT_STATEMENT_THEN_VIEW',
      (editorType, editorId) => ({editorType, editorId})),
  commitEditThenPutActionOnSuccess: actionCreator('FLOWS/COMMIT_EDIT_THEN_PUT_ACTION_ON_SUCCESS',
      (editorType, editorId, onSuccessAction) => ({editorType, editorId, onSuccessAction})),
}

export const autocompletes = {
  clearSuggestions: actionCreator('AUTOCOMPLETES/CLEAR_SUGGESTIONS', suggestionsKey => ({suggestionsKey}))
}