import { createAction as actionCreator } from 'redux-actions'
import {
  JustificationVotePolarity,
  makePropositionTagVote,
  PropositionTagVotePolarity,
} from "howdju-common"
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import assign from 'lodash/assign'

import {actions} from 'howdju-client-common'

const actionTypeDelim = '/'

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = actions.str

/** Helper to easily allow us to pass an object with 'action groups' to redux-react's connect method.
 * Action groups are what we call the objects below with react-actions action creators.  They are just
 * a way to organize related action creators.  The convention with redux-react's connect method's mapDispatchToProps
 * is to pass an object with keys equal to action creators.  redux-react will automatically turn the action creators
 * into dispatched versions.  This helper accomplishes the same for an object the properties of which are action creator
 * groups like those defined below.
 */
export const mapActionCreatorGroupToDispatchToProps = (actionCreatorGroups, otherActions) => (dispatch) => {
  const dispatchProps = mapValues(actionCreatorGroups, (actionCreatorGroup) =>
    // Why not mapValues(..., bindActionCreators)? https://redux.js.org/api/bindactioncreators
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
  clearAuthToken: actionCreator('APP/CLEAR_AUTH_TOKEN'),
  checkAuthExpiration: actionCreator('APP/CHECK_AUTH_EXPIRATION'),
}

/** Actions that directly result in API calls */
export const api = {
  callApi: apiActionCreator('CALL_API'),
  fetchProposition: apiActionCreator('FETCH_PROPOSITION', (propositionId) => ({propositionId})),
  fetchPropositions: apiActionCreator('FETCH_PROPOSITIONS', (propositionIds) => ({propositionIds})),
  fetchPropositionCompound: apiActionCreator('FETCH_PROPOSITION_COMPOUND', (propositionCompoundId) => ({propositionCompoundId})),
  fetchRootJustificationTarget: apiActionCreator('FETCH_ROOT_JUSTIFICATION_TARGET',
    (rootTargetType, rootTargetId) => ({
      rootTargetType,
      rootTargetId,
    })
  ),
  fetchWritQuote: apiActionCreator('FETCH_WRIT_QUOTE', (writQuoteId) => ({writQuoteId})),
  fetchJustificationBasisCompound: apiActionCreator('FETCH_JUSTIFICATION_BASIS_COMPOUND',
    (justificationBasisCompoundId) => ({justificationBasisCompoundId})),
  fetchSourceExcerptParaphrase: apiActionCreator('FETCH_SOURCE_EXCERPT_PARAPHRASE',
    (sourceExcerptParaphraseId) => ({sourceExcerptParaphraseId})),
  fetchPersorg: apiActionCreator('FETCH_PERSORG', (persorgId) => ({persorgId})),
  fetchSpeakerStatements: apiActionCreator('FETCH_PERSORG_STATEMENTS', (speakerPersorgId) => ({speakerPersorgId})),
  fetchSentenceStatements: apiActionCreator('FETCH_SENTENCE_STATEMENTS', (sentenceType, sentenceId) => ({sentenceType, sentenceId})),
  fetchRootPropositionStatements: apiActionCreator('FETCH_ROOT_PROPOSITION_STATEMENTS', (propositionId) => ({propositionId})),
  fetchIndirectPropositionStatements: apiActionCreator('FETCH_INDIRECT_PROPOSITION_STATEMENTS', (propositionId) => ({propositionId})),

  fetchRecentPropositions: apiActionCreator('FETCH_RECENT_PROPOSITIONS', (widgetId, count, continuationToken) => ({widgetId, count, continuationToken})),
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

  createTag: apiActionCreator('CREATE_TAG', (tagTagetType, tagTargetId, tag, tagVote) => ({
    tagTagetType, tagTargetId, tag, tagVote
  })),
  createAntiTag: apiActionCreator('CREATE_ANTI_TAG', (tagTagetType, tagTargetId, tag, tagVote) => ({
    tagTagetType, tagTargetId, tag, tagVote
  })),
  unTag: apiActionCreator('UN_TAG', (tagVote) => ({tagVote})),

  tagProposition: apiActionCreator('TAG_PROPOSITION', (propositionId, tag, propositionTagVote) => ({
    propositionTagVote: makePropositionTagVote({
      polarity: PropositionTagVotePolarity.POSITIVE,
      proposition: {id: propositionId},
      tag,
    }),
    prevPropositionTagVote: propositionTagVote,
  })),
  antiTagProposition: apiActionCreator('ANTI_TAG_PROPOSITION', (propositionId, tag, propositionTagVote) => ({
    propositionTagVote: makePropositionTagVote({
      polarity: PropositionTagVotePolarity.NEGATIVE,
      proposition: {id: propositionId},
      tag,
    }),
    prevPropositionTagVote: propositionTagVote,
  })),
  unTagProposition: apiActionCreator('UN_TAG_PROPOSITION', (propositionTagVote) => ({prevPropositionTagVote: propositionTagVote})),

  createProposition: apiActionCreator('CREATE_PROPOSITION', (proposition) => ({proposition})),
  updateProposition: apiActionCreator('UPDATE_PROPOSITION', (proposition) => ({proposition}), (s, nonce) => ({nonce})),
  deleteProposition: apiActionCreator('DELETE_PROPOSITION', (proposition) => ({proposition})),

  createStatement: apiActionCreator('CREATE_STATEMENT', (statement) => ({statement})),

  updatePersorg: apiActionCreator('UPDATE_PERSORG', (persorg) => ({persorg})),

  fetchPropositionTextSuggestions: apiActionCreator('FETCH_PROPOSITION_TEXT_SUGGESTIONS', (propositionText, suggestionsKey) => ({
    propositionText,
    suggestionsKey,
  })),
  cancelPropositionTextSuggestions: apiActionCreator('CANCEL_PROPOSITION_TEXT_SUGGESTIONS', (suggestionsKey) => ({
    cancelTarget: str(api.fetchPropositionTextSuggestions),
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

  fetchPersorgNameSuggestions: apiActionCreator('FETCH_PERSORG_NAME_SUGGESTIONS', (searchText, suggestionsKey) => ({
    searchText,
    suggestionsKey,
  })),
  cancelPersorgNameSuggestions: apiActionCreator('CANCEL_PERSORG_NAME_SUGGESTIONS', (suggestionsKey) => ({
    cancelTarget: str(api.fetchPersorgNameSuggestions),
    suggestionsKey,
  })),

  createJustification: apiActionCreator('CREATE_JUSTIFICATION', (justification) => ({justification})),
  updateWritQuote: apiActionCreator('UPDATE_WRIT_QUOTE', (writQuote) => ({writQuote})),
  deleteJustification: apiActionCreator('DELETE_JUSTIFICATION', (justification) => ({justification})),

  fetchMainSearchResults: apiActionCreator('FETCH_MAIN_SEARCH_RESULTS', (searchText) => ({searchText})),
  fetchPropositionsSearch: apiActionCreator('FETCH_PROPOSITIONS_SEARCH', (searchText) => ({searchText})),

  fetchTag: apiActionCreator('FETCH_TAG', (tagId) => ({tagId})),
  fetchTaggedPropositions: apiActionCreator('FETCH_TAGGED_PROPOSITIONS', (tagId) => ({tagId})),
}
export const apiActionCreatorsByActionType = reduce(api, (result, actionCreator) => {
  result[actionCreator] = actionCreator
  return result
}, {})

/** "API-like": actions that indirectly result in API calls, such as actions that are translated into one or another
 * API call depending on some payload value or those that correspond to multiple API calls
 */
export const apiLike = {
  deleteJustificationRootTarget: actionCreator('DELETE_JUSTIFICATION_ROOT_TARGET',
    (rootTargetType, rootTarget) => ({rootTargetType, rootTarget})),
  fetchJustificationTargets: actionCreator('FETCH_JUSTIFICATION_TARGETS', (targetInfos) => ({targetInfos})),
}

/** UI actions */
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
  setCanHover: actionCreator('UI/SET_CAN_HOVER', (canHover) => ({canHover})),

  expand: actionCreator('UI/EXPAND', (widgetId) => ({widgetId})),
  collapse: actionCreator('UI/COLLAPSE', (widgetId) => ({widgetId})),

  enableMobileSite: actionCreator('UI/ENABLE_MOBILE_SITE'),
  disableMobileSite: actionCreator('UI/DISABLE_MOBILE_SITE'),

  clearTaggedPropositions: actionCreator('UI/CLEAR_TAGGED_PROPOSITIONS'),
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
/** Editor actions */
export const editors = {
  beginEdit: actionCreator('EDITORS/BEGIN_EDIT', (editorType, editorId, entity) => ({editorType, editorId, entity})),
  propertyChange: actionCreator('EDITORS/PROPERTY_CHANGE', (editorType, editorId, properties) => ({editorType, editorId, properties})),
  commitEdit,
  cancelEdit: actionCreator('EDITORS/CANCEL_EDIT', (editorType, editorId) => ({editorType, editorId})),

  addSpeaker: actionCreator('EDITORS/ADD_SPEAKER', (editorType, editorId) => ({editorType, editorId})),
  removeSpeaker: actionCreator('EDITORS/REMOVE_SPEAKER', (editorType, editorId, speaker, index) => ({
    editorType, editorId, speaker, index
  })),
  replaceSpeaker: actionCreator('EDITORS/REPLACE_SPEAKER', (editorType, editorId, speaker, index) => ({
    editorType, editorId, speaker, index
  })),

  addUrl: actionCreator('EDITORS/ADD_URL', (editorType, editorId) => ({editorType, editorId})),
  removeUrl: actionCreator('EDITORS/REMOVE_URL', (editorType, editorId, url, index) => ({
    editorType,
    editorId,
    url,
    index
  })),

  addPropositionCompoundAtom: actionCreator('EDITORS/ADD_PROPOSITION_COMPOUND_ATOM', (editorType, editorId, index) => ({
    editorType,
    editorId,
    index,
  })),
  removePropositionCompoundAtom: actionCreator('EDITORS/REMOVE_PROPOSITION_COMPOUND_ATOM', (editorType, editorId, atom, index) => ({
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

  tagProposition: actionCreator('EDITORS/TAG_PROPOSITION', (editorType, editorId, tag) => ({editorType, editorId, tag})),
  unTagProposition: actionCreator('EDITORS/UN_TAG_PROPOSITION', (editorType, editorId, tag) => ({editorType, editorId, tag})),
  antiTagProposition: actionCreator('EDITORS/ANTI_TAG_PROPOSITION', (editorType, editorId, tag) => ({editorType, editorId, tag})),
}

/** Actions that change the current page */
export const goto = {
  login: actionCreator('GOTO/LOGIN', (loginRedirectLocation) => ({loginRedirectLocation})),
  proposition: actionCreator('GOTO/PROPOSITION', (proposition) => ({proposition})),
  statement: actionCreator('GOTO/STATEMENT', (statement) => ({statement})),
  mainSearch: actionCreator('GOTO/MAIN_SEARCH', (mainSearchText) => ({mainSearchText})),
  tag: actionCreator('GOTO/TAG', (tag) => ({tag})),
  createJustification: actionCreator('GOTO/CREATE_JUSTIFICATION'),
}

/** Actions that represent multi-step flows */
export const flows = {
  fetchAndBeginEditOfNewJustificationFromBasisSource: actionCreator(
    'FLOWS/FETCH_AND_BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_BASIS_SOURCE',
    (editorType, editorId, basisSourceType, basisSourceId) => ({editorType, editorId, basisSourceType, basisSourceId})
  ),
  beginEditOfNewJustificationFromTarget: actionCreator(
    'FLOWS/BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_TARGET',
    (content, source, target) => ({content, source, target})
  ),
  commitEditThenView: actionCreator('FLOWS/COMMIT_PROPOSITION_THEN_VIEW',
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
