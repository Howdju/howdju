import { createAction as actionCreator } from 'redux-actions'
import {
  JustificationVotePolarity,
  decircularizeJustification,
  makeStatementTagVote,
  StatementTagVotePolarity,
} from "howdju-common"
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import assign from 'lodash/assign'

const actionTypeDelim = '/'

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = ac => ac.toString()

/** Helper to easily allow us to pass an object with 'action groups' to redux-react's connect method.
 * Action groups are what we call the objects below with react-actions action creators.  They are just
 * a way to organize related action creators.  The convention with redux-react's connect method's mapDispatchToProps
 * is to pass an object with keys equal to action creators.  redux-react will automatically turn the action creators
 * into dispatched versions.  This helper accomplishes the same for an object the properties of which are action creator
 * groups like those defined below.
 */
export const mapActionCreatorGroupToDispatchToProps = (actionCreatorGroups, otherActions) => (dispatch) => {
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
  const actionType = 'API' + actionTypeDelim + args[0]
  const ac = actionCreator(actionType, ...args.slice(1))
  ac.response = actionCreator(actionType + actionTypeDelim + 'RESPONSE', (payload, meta) => payload, (payload, meta) => meta)
  return ac
}

export const app = {
  searchMainSearch: actionCreator('APP/SEARCH_MAIN_SEARCH', searchText => ({searchText})),
}

export const api = {
  callApi: apiActionCreator('CALL_API'),
  fetchStatement: apiActionCreator('FETCH_STATEMENT', (statementId) => ({statementId})),
  fetchStatements: apiActionCreator('FETCH_STATEMENTS', (statementIds) => ({statementIds})),
  fetchStatementCompound: apiActionCreator('FETCH_STATEMENT_COMPOUND', (statementCompoundId) => ({statementCompoundId})),
  fetchStatementJustifications: apiActionCreator('FETCH_STATEMENT_JUSTIFICATIONS', (statementId) => ({statementId})),
  fetchWritQuote: apiActionCreator('FETCH_WRIT_QUOTE', (writQuoteId) => ({writQuoteId})),
  fetchJustificationBasisCompound: apiActionCreator('FETCH_JUSTIFICATION_BASIS_COMPOUND',
    (justificationBasisCompoundId) => ({justificationBasisCompoundId})),
  fetchSourceExcerptParaphrase: apiActionCreator('FETCH_SOURCE_EXCERPT_PARAPHRASE',
    (sourceExcerptParaphraseId) => ({sourceExcerptParaphraseId})),

  fetchRecentStatements: apiActionCreator('FETCH_RECENT_STATEMENTS', (widgetId, count, continuationToken) => ({widgetId, count, continuationToken})),
  fetchRecentWrits: apiActionCreator('FETCH_RECENT_WRITS', (widgetId, count, continuationToken) => ({widgetId, continuationToken, count})),
  fetchRecentWritQuotes: apiActionCreator('FETCH_RECENT_WRIT_QUOTES', (widgetId, count, continuationToken) => ({widgetId, count, continuationToken})),
  fetchRecentJustifications: apiActionCreator('FETCH_RECENT_JUSTIFICATIONS', (widgetId, count, continuationToken) => ({widgetId, count, continuationToken})),

  fetchFeaturedPerspectives: apiActionCreator('FETCH_FEATURED_PERSPECTIVES', (widgetId) => ({widgetId})),

  fetchJustificationsSearch: apiActionCreator('FETCH_JUSTIFICATIONS_SEARCH',
    ({filters, count, continuationToken}) => ({filters, count, continuationToken})
  ),
  login: apiActionCreator('LOGIN', (credentials) => ({credentials})),
  logout: apiActionCreator('LOGOUT'),

  verifyJustification: apiActionCreator('VERIFY_JUSTIFICATION', (justification) => ({
    justificationVote: {
      justificationId: justification.id,
      polarity: JustificationVotePolarity.POSITIVE,
    },
    previousJustificationVote: justification.vote,
  })),
  unVerifyJustification: apiActionCreator('UN_VERIFY_JUSTIFICATION', (justification) => ({
    justificationVote: {
      justificationId: justification.id,
      polarity: JustificationVotePolarity.POSITIVE,
    },
    previousJustificationVote: justification.vote,
  })),
  disverifyJustification: apiActionCreator('DISVERIFY_JUSTIFICATION', (justification) => ({
    justificationVote: {
      justificationId: justification.id,
      polarity: JustificationVotePolarity.NEGATIVE,
    },
    previousJustificationVote: justification.vote,
  })),
  unDisverifyJustification: apiActionCreator('UN_DISVERIFY_JUSTIFICATION', (justification) => ({
    justificationVote: {
      justificationId: justification.id,
      polarity: JustificationVotePolarity.NEGATIVE,
    },
    previousJustificationVote: justification.vote,
  })),

  tagStatement: apiActionCreator('TAG_STATEMENT', (statementId, tag, statementTagVote) => ({
    statementTagVote: makeStatementTagVote({
      polarity: StatementTagVotePolarity.POSITIVE,
      statement: {id: statementId},
      tag,
    }),
    prevStatementTagVote: statementTagVote,
  })),
  antiTagStatement: apiActionCreator('ANTI_TAG_STATEMENT', (statementId, tag, statementTagVote) => ({
    statementTagVote: makeStatementTagVote({
      polarity: StatementTagVotePolarity.NEGATIVE,
      statement: {id: statementId},
      tag,
    }),
    prevStatementTagVote: statementTagVote,
  })),
  unTagStatement: apiActionCreator('UN_TAG_STATEMENT', (statementTagVote) => ({prevStatementTagVote: statementTagVote})),

  createStatement: apiActionCreator('CREATE_STATEMENT', (statement) => ({statement})),
  updateStatement: apiActionCreator('UPDATE_STATEMENT', (statement) => ({statement}), (s, nonce) => ({nonce})),
  deleteStatement: apiActionCreator('DELETE_STATEMENT', (statement) => ({statement})),

  fetchStatementTextSuggestions: apiActionCreator('FETCH_STATEMENT_TEXT_SUGGESTIONS', (statementText, suggestionsKey) => ({
    statementText,
    suggestionsKey,
  })),
  cancelStatementTextSuggestions: apiActionCreator('CANCEL_STATEMENT_TEXT_SUGGESTIONS', (suggestionsKey) => ({
    cancelTarget: str(api.fetchStatementTextSuggestions),
    suggestionsKey,
  })),

  fetchWritTitleSuggestions: apiActionCreator('FETCH_WRIT_TITLE_SUGGESTIONS', (writTitle, suggestionsKey) => ({
    writTitle,
    suggestionsKey,
  })),
  cancelWritTitleSuggestions: apiActionCreator('CANCEL_WRIT_TITLE_SUGGESTIONS', (suggestionsKey) => ({
    cancelTarget: str(api.fetchWritTitleSuggestions),
    suggestionsKey,
  })),

  fetchTagNameSuggestions: apiActionCreator('FETCH_TAG_NAME_SUGGESTIONS', (tagName, suggestionsKey) => ({
    tagName,
    suggestionsKey,
  })),
  cancelTagNameSuggestions: apiActionCreator('CANCEL_TAG_NAME_SUGGESTIONS', (suggestionsKey) => ({
    cancelTarget: str(api.fetchTagNameSuggestions),
    suggestionsKey,
  })),

  fetchMainSearchSuggestions: apiActionCreator('FETCH_MAIN_SEARCH_SUGGESTIONS', (searchText, suggestionsKey) => ({
    searchText,
    suggestionsKey
  })),
  cancelMainSearchSuggestions: apiActionCreator('CANCEL_MAIN_SEARCH_SUGGESTIONS', (suggestionsKey) => ({
    cancelTarget: str(api.fetchMainSearchSuggestions),
    suggestionsKey,
  })),

  createJustification: apiActionCreator('CREATE_JUSTIFICATION', (justification) => ({justification: decircularizeJustification(justification)})),
  updateWritQuote: apiActionCreator('UPDATE_WRIT_QUOTE', (writQuote) => ({writQuote})),
  deleteJustification: apiActionCreator('DELETE_JUSTIFICATION', (justification) => ({justification})),

  fetchMainSearchResults: apiActionCreator('FETCH_MAIN_SEARCH_RESULTS', (searchText) => ({searchText})),
  fetchStatementsSearch: apiActionCreator('FETCH_STATEMENTS_SEARCH', (searchText) => ({searchText})),

  fetchTag: apiActionCreator('FETCH_TAG', (tagId) => ({tagId})),
  fetchTaggedStatements: apiActionCreator('FETCH_TAGGED_STATEMENTS', (tagId) => ({tagId})),
}
export const apiActionCreatorsByActionType = reduce(api, (result, actionCreator) => {
  result[actionCreator] = actionCreator
  return result
}, {})

export const ui = {
  unhandledAppClick: actionCreator('UI/UNHANDLED_APP_CLICK'),
  unhandledAppTouch: actionCreator('UI/UNHANDLED_APP_TOUCH'),
  showNavDrawer: actionCreator('SHOW_NAV_DRAWER'),
  hideNavDrawer: actionCreator('HIDE_NAV_DRAWER'),
  toggleNavDrawerVisibility: actionCreator('TOGGLE_NAV_DRAWER_VISIBILITY'),
  setNavDrawerVisibility: actionCreator('SET_NAV_DRAWER_VISIBILITY'),
  addToast: actionCreator('ADD_TOAST', (text) => ({text})),
  dismissToast: actionCreator('DISMISS_TOAST'),

  showNewJustificationDialog: actionCreator('SHOW_NEW_JUSTIFICATION_DIALOG'),
  hideNewJustificationDialog: actionCreator('HIDE_NEW_JUSTIFICATION_DIALOG'),

  mainSearchTextChange: actionCreator('MAIN_SEARCH_TEXT_CHANGE'),
  loginCredentialChange: actionCreator('LOGIN_CREDENTIAL_CHANGE'),
  clearJustificationsSearch: actionCreator('UI/CLEAR_JUSTIFICATIONS_SEARCH'),

  clearRecentStatements: actionCreator('UI/CLEAR_RECENT_STATEMENTS', (widgetId) => ({widgetId})),
  clearRecentWrits: actionCreator('UI/CLEAR_RECENT_WRITS', (widgetId) => ({widgetId})),
  clearRecentWritQuotes: actionCreator('UI/CLEAR_RECENT_WRIT_QUOTES', (widgetId) => ({widgetId})),
  clearRecentJustifications: actionCreator('UI/CLEAR_RECENT_JUSTIFICATIONS', (widgetId) => ({widgetId})),

  beginInteractionWithTransient: actionCreator('UI/BEGIN_INTERACTION_WITH_TRANSIENT', (transientId) => ({transientId})),
  endInteractionWithTransient: actionCreator('UI/END_INTERACTION_WITH_TRANSIENT', (transientId) => ({transientId})),
  showTransient: actionCreator('UI/SHOW_TRANSIENT', (transientId) => ({transientId})),
  scheduleDelayedHideTransient: actionCreator('UI/SCHEDULE_DELAYED_HIDE_TRANSIENT', (transientId, hideDelay) => ({transientId, hideDelay})),
  tryCancelDelayedHideTransient: actionCreator('UI/TRY_CANCEL_DELAYED_HIDE_TRANSIENT',
    (transientId, cause) => ({transientId}),
    (transientId, cause) => ({cause}),
  ),
  cancelDelayedHideTransient: actionCreator('UI/CANCEL_DELAYED_HIDE_TRANSIENT', (transientId) => ({transientId})),
  hideAllTransients: actionCreator('UI/HIDE_ALL_TRANSIENTS'),
  hideOtherTransients: actionCreator('UI/HIDE_OTHER_TRANSIENTS', (visibleTransientId) => ({visibleTransientId})),
  hideTransient: actionCreator('UI/HIDE_TRANSIENT',
    (transientId, cause) => ({transientId}),
    (transientId, cause) => ({cause}),
  ),
  windowResize: actionCreator('UI/WINDOW_RESIZE'),

  expand: actionCreator('UI/EXPAND', (widgetId) => ({widgetId})),
  collapse: actionCreator('UI/COLLAPSE', (widgetId) => ({widgetId})),

  enableMobileSite: actionCreator('UI/ENABLE_MOBILE_SITE'),
  disableMobileSite: actionCreator('UI/DISABLE_MOBILE_SITE'),

  clearTaggedStatements: actionCreator('UI/CLEAR_TAGGED_STATEMENTS'),
}

const commitEdit = actionCreator('EDITORS/COMMIT_EDIT', (editorType, editorId) => ({editorType, editorId}))
commitEdit.result = actionCreator('EDITORS/COMMIT_EDIT' + actionTypeDelim + 'RESULT',
  (editorType, editorId, result) => ({editorType, editorId, result}),
  (...args) => {
    if (args.length === 4) {
      return args[3]
    } else if (args.length === 2 && args[0] instanceof Error) {
      return args[1]
    }
    return undefined
  }
)
export const editors = {
  beginEdit: actionCreator('EDITORS/BEGIN_EDIT', (editorType, editorId, entity) => ({editorType, editorId, entity})),
  propertyChange: actionCreator('EDITORS/PROPERTY_CHANGE', (editorType, editorId, properties) => ({editorType, editorId, properties})),
  commitEdit,
  cancelEdit: actionCreator('EDITORS/CANCEL_EDIT', (editorType, editorId) => ({editorType, editorId})),

  addUrl: actionCreator('EDITORS/ADD_URL', (editorType, editorId) => ({editorType, editorId})),
  removeUrl: actionCreator('EDITORS/REMOVE_URL', (editorType, editorId, url, index) => ({
    editorType,
    editorId,
    url,
    index
  })),

  addStatementCompoundAtom: actionCreator('EDITORS/ADD_STATEMENT_COMPOUND_ATOM', (editorType, editorId, index) => ({
    editorType,
    editorId,
    index,
  })),
  removeStatementCompoundAtom: actionCreator('EDITORS/REMOVE_STATEMENT_COMPOUND_ATOM', (editorType, editorId, atom, index) => ({
    editorType,
    editorId,
    atom,
    index
  })),

  addJustificationBasisCompoundAtom: actionCreator('EDITORS/ADD_JUSTIFICATION_BASIS_COMPOUND_ATOM',
    (editorType, editorId, index) => ({
      editorType,
      editorId,
      index,
    })
  ),
  removeJustificationBasisCompoundAtom: actionCreator('EDITORS/REMOVE_JUSTIFICATION_BASIS_COMPOUND_ATOM',
    (editorType, editorId, atom, index) => ({
      editorType,
      editorId,
      atom,
      index
    })
  ),
  addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl: actionCreator(
    'EDITORS/ADD_JUSTIFICATION_BASIS_COMPOUND_ATOM_SOURCE_EXCERPT_PARAPHRASE_WRIT_QUOTE_URL',
    (editorType, editorId, atomIndex, urlIndex) => ({editorType, editorId, atomIndex, urlIndex})
  ),
  removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl: actionCreator(
    'EDITORS/REMOVE_JUSTIFICATION_BASIS_COMPOUND_ATOM_SOURCE_EXCERPT_PARAPHRASE_WRIT_QUOTE_URL',
    (editorType, editorId, atom, atomIndex, url, urlIndex) => ({editorType, editorId, atom, atomIndex, url, urlIndex})
  ),

  tagStatement: actionCreator('EDITORS/TAG_STATEMENT', (editorType, editorId, tag) => ({editorType, editorId, tag})),
  unTagStatement: actionCreator('EDITORS/UN_TAG_STATEMENT', (editorType, editorId, tag) => ({editorType, editorId, tag})),
  antiTagStatement: actionCreator('EDITORS/ANTI_TAG_STATEMENT', (editorType, editorId, tag) => ({editorType, editorId, tag})),
}

export const goto = {
  login: actionCreator('GOTO/LOGIN', (loginRedirectLocation) => ({loginRedirectLocation})),
  statement: actionCreator('GOTO/STATEMENT', (statement) => ({statement})),
  mainSearch: actionCreator('GOTO/MAIN_SEARCH', (mainSearchText) => ({mainSearchText})),
  tag: actionCreator('GOTO/TAG', (tag) => ({tag})),
}

export const flows = {
  fetchAndBeginEditOfNewJustificationFromBasisSource: actionCreator(
    'FLOWS/FETCH_AND_BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_BASIS_SOURCE',
    (editorType, editorId, basisSourceType, basisSourceId) => ({editorType, editorId, basisSourceType, basisSourceId})
  ),
  commitEditThenView: actionCreator('FLOWS/COMMIT_STATEMENT_THEN_VIEW',
    (editorType, editorId) => ({editorType, editorId})),
  commitEditThenPutActionOnSuccess: actionCreator('FLOWS/COMMIT_EDIT_THEN_PUT_ACTION_ON_SUCCESS',
    (editorType, editorId, onSuccessAction) => ({editorType, editorId, onSuccessAction})),
}

export const autocompletes = {
  clearSuggestions: actionCreator('AUTOCOMPLETES/CLEAR_SUGGESTIONS', (suggestionsKey) => ({suggestionsKey}))
}

export const errors = {
  clearLoggedErrors: actionCreator('ERRORS/CLEAR_LOGGED_ERRORS'),
}