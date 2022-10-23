import {
  ActionFunctionAny,
} from "redux-actions";
import { Location } from "history";
import { Action } from "redux";

import {
  EntityId,
  WritQuote,
  JustificationRootTargetType,
  Proposition,
  JustificationRootTarget,
  Persorg,
  Url,
  PropositionCompoundAtom,
  Tag,
  Statement,
  Justification,
  JustificationBasisSourceType,
  Persisted,
} from "howdju-common";
import {
  Source,
  Target,
  ExtensionAnnotationContent,
} from "howdju-client-common";

import { EditorEntity, EditorType } from "./reducers/editors";
import {
  ContextTrailItemInfo,
  PrivacyConsentCookie,
  PropertyChanges,
  SuggestionsKey,
  WidgetId,
  EditorId,
} from "./types";
import { createAction, actionTypeDelim } from "./actionHelpers";

export {str} from "./actionHelpers"

export const app = {
  searchMainSearch: createAction(
    "APP/SEARCH_MAIN_SEARCH",
    (searchText: string) => ({ searchText })
  ),
  clearAuthToken: createAction("APP/CLEAR_AUTH_TOKEN"),
  checkAuthExpiration: createAction("APP/CHECK_AUTH_EXPIRATION"),
};

export {mapActionCreatorGroupToDispatchToProps, combineActions} from "./actionHelpers"

/** Actions that directly result in API calls */
export const api = {
  callApi: apiActionCreator("CALL_API"),
  fetchProposition: apiActionCreator(
    "FETCH_PROPOSITION",
    (propositionId: EntityId) => ({ propositionId })
  ),
  fetchPropositions: apiActionCreator(
    "FETCH_PROPOSITIONS",
    (propositionIds: EntityId[]) => ({ propositionIds })
  ),
  fetchPropositionCompound: apiActionCreator(
    "FETCH_PROPOSITION_COMPOUND",
    (propositionCompoundId: EntityId) => ({ propositionCompoundId })
  ),
  fetchRootJustificationTarget: apiActionCreator(
    "FETCH_ROOT_JUSTIFICATION_TARGET",
    (rootTargetType: JustificationRootTargetType, rootTargetId: EntityId): JustificationRootTargetInfo => ({
      rootTargetType,
      rootTargetId,
    }),
    ({
      rootTargetType,
      rootTargetId,
    }) => {
      const {endpoint, normalizationSchema} = rootTargetEndpointsByType[rootTargetType]
      return {
        endpoint: `${endpoint}/${rootTargetId}?include=justifications`,
        fetchInit: {
          method: httpMethods.GET,
        },
        normalizationSchema,
      }
    }
  ),

  fetchWritQuote: apiActionCreator(
    "FETCH_WRIT_QUOTE",
    (writQuoteId: EntityId) => ({ writQuoteId })
  ),
  createWritQuote: apiActionCreator(
    "CREATE_WRIT_QUOTE",
    (writQuote: WritQuote) => ({ writQuote })
  ),
  updateWritQuote: apiActionCreator(
    "UPDATE_WRIT_QUOTE",
    (writQuote: WritQuote) => ({ writQuote })
  ),

  fetchSourceExcerptParaphrase: apiActionCreator(
    "FETCH_SOURCE_EXCERPT_PARAPHRASE",
    (sourceExcerptParaphraseId) => ({ sourceExcerptParaphraseId })
  ),
  fetchPersorg: apiActionCreator("FETCH_PERSORG", (persorgId) => ({
    persorgId,
  })),
  fetchSpeakerStatements: apiActionCreator(
    "FETCH_PERSORG_STATEMENTS",
    (speakerPersorgId) => ({ speakerPersorgId })
  ),
  fetchSentenceStatements: apiActionCreator(
    "FETCH_SENTENCE_STATEMENTS",
    (sentenceType, sentenceId) => ({ sentenceType, sentenceId })
  ),
  fetchRootPropositionStatements: apiActionCreator(
    "FETCH_ROOT_PROPOSITION_STATEMENTS",
    (propositionId) => ({ propositionId })
  ),
  fetchIndirectPropositionStatements: apiActionCreator(
    "FETCH_INDIRECT_PROPOSITION_STATEMENTS",
    (propositionId) => ({ propositionId })
  ),

  fetchRecentPropositions: apiActionCreator(
    "FETCH_RECENT_PROPOSITIONS",
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    })
  ),
  fetchRecentWrits: apiActionCreator(
    "FETCH_RECENT_WRITS",
    (widgetId, count, continuationToken) => ({
      widgetId,
      continuationToken,
      count,
    })
  ),
  fetchRecentWritQuotes: apiActionCreator(
    "FETCH_RECENT_WRIT_QUOTES",
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    })
  ),
  fetchRecentJustifications: apiActionCreator(
    "FETCH_RECENT_JUSTIFICATIONS",
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    })
  ),

  fetchFeaturedPerspectives: apiActionCreator(
    "FETCH_FEATURED_PERSPECTIVES",
    (widgetId) => ({ widgetId })
  ),

  createAccountSettings: apiActionCreator(
    "CREATE_ACCOUNT_SETTINGS",
    (accountSettings) => ({ accountSettings })
  ),
  fetchAccountSettings: apiActionCreator("FETCH_ACCOUNT_SETTINGS"),
  updateAccountSettings: apiActionCreator(
    "UPDATE_ACCOUNT_SETTINGS",
    (accountSettings) => ({ accountSettings })
  ),

  createContentReport: apiActionCreator(
    "CREATE_CONTENT_REPORT",
    (contentReport) => ({ contentReport })
  ),

  fetchJustificationsSearch: apiActionCreator(
    "FETCH_JUSTIFICATIONS_SEARCH",
    ({ filters, includeUrls, count, continuationToken }) => ({
      filters,
      includeUrls,
      count,
      continuationToken,
    })
  ),
  login: apiActionCreator("LOGIN", (credentials) => ({ credentials })),
  logout: apiActionCreator("LOGOUT"),

  requestPasswordReset: apiActionCreator(
    "REQUEST_PASSWORD_RESET",
    (passwordResetRequest) => ({ passwordResetRequest })
  ),
  checkPasswordResetRequest: apiActionCreator(
    "CHECK_PASSWORD_RESET_REQUEST",
    (passwordResetCode) => ({ passwordResetCode })
  ),
  confirmPasswordReset: apiActionCreator(
    "CONFIRM_PASSWORD_RESET",
    (passwordResetCode, passwordResetConfirmation) => ({
      passwordResetCode,
      passwordResetConfirmation,
    })
  ),

  requestRegistration: apiActionCreator(
    "REQUEST_REGISTRATION",
    (registrationRequest) => ({ registrationRequest })
  ),
  checkRegistration: apiActionCreator(
    "CHECK_REGISTRATION",
    (registrationCode) => ({ registrationCode })
  ),
  confirmRegistration: apiActionCreator(
    "CONFIRM_REGISTRATION",
    (registrationConfirmation) => ({ registrationConfirmation })
  ),

  verifyJustification: apiActionCreator(
    "VERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),
  unVerifyJustification: apiActionCreator(
    "UN_VERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),
  disverifyJustification: apiActionCreator(
    "DISVERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.NEGATIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),
  unDisverifyJustification: apiActionCreator(
    "UN_DISVERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.NEGATIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),

  createTag: apiActionCreator(
    "CREATE_TAG",
    (tagTagetType, tagTargetId, tag, tagVote) => ({
      tagTagetType,
      tagTargetId,
      tag,
      tagVote,
    })
  ),
  createAntiTag: apiActionCreator(
    "CREATE_ANTI_TAG",
    (tagTagetType, tagTargetId, tag, tagVote) => ({
      tagTagetType,
      tagTargetId,
      tag,
      tagVote,
    })
  ),
  unTag: apiActionCreator("UN_TAG", (tagVote) => ({ tagVote })),

  tagProposition: apiActionCreator(
    "TAG_PROPOSITION",
    (
      propositionId: EntityId,
      tag: Tag,
      propositionTagVote: PropositionTagVote
    ) => ({
      propositionTagVote: makePropositionTagVoteSubmissionModel({
        polarity: PropositionTagVotePolarities.POSITIVE,
        proposition: { id: propositionId },
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    })
  ),
  antiTagProposition: apiActionCreator(
    "ANTI_TAG_PROPOSITION",
    (propositionId, tag, propositionTagVote) => ({
      propositionTagVote: makePropositionTagVoteSubmissionModel({
        polarity: PropositionTagVotePolarities.NEGATIVE,
        proposition: { id: propositionId },
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    })
  ),
  unTagProposition: apiActionCreator(
    "UN_TAG_PROPOSITION",
    (propositionTagVote: Persisted<PropositionTagVote>) => ({
      prevPropositionTagVote: propositionTagVote,
    })
  ),

  createProposition: apiActionCreator("CREATE_PROPOSITION", (proposition) => ({
    proposition,
  })),
  updateProposition: apiActionCreator(
    "UPDATE_PROPOSITION",
    (proposition: Proposition) => ({ proposition }),
  ),
  deleteProposition: apiActionCreator("DELETE_PROPOSITION", (proposition) => ({
    proposition,
  })),

  createStatement: apiActionCreator("CREATE_STATEMENT", (statement) => ({
    statement,
  })),

  updatePersorg: apiActionCreator("UPDATE_PERSORG", (persorg) => ({ persorg })),

  fetchPropositionTextSuggestions: apiActionCreator(
    "FETCH_PROPOSITION_TEXT_SUGGESTIONS",
    (propositionText, suggestionsKey) => ({
      propositionText,
      suggestionsKey,
    })
  ),
  cancelPropositionTextSuggestions: apiActionCreator(
    "CANCEL_PROPOSITION_TEXT_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_PROPOSITION_TEXT_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchWritTitleSuggestions: apiActionCreator(
    "FETCH_WRIT_TITLE_SUGGESTIONS",
    (writTitle, suggestionsKey) => ({
      writTitle,
      suggestionsKey,
    })
  ),
  cancelWritTitleSuggestions: apiActionCreator(
    "CANCEL_WRIT_TITLE_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_WRIT_TITLE_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchTagNameSuggestions: apiActionCreator(
    "FETCH_TAG_NAME_SUGGESTIONS",
    (tagName, suggestionsKey) => ({
      tagName,
      suggestionsKey,
    })
  ),
  cancelTagNameSuggestions: apiActionCreator(
    "CANCEL_TAG_NAME_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_TAG_NAME_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchMainSearchSuggestions: apiActionCreator(
    "FETCH_MAIN_SEARCH_SUGGESTIONS",
    (searchText, suggestionsKey) => ({
      searchText,
      suggestionsKey,
    })
  ),
  cancelMainSearchSuggestions: apiActionCreator(
    "CANCEL_MAIN_SEARCH_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_MAIN_SEARCH_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchPersorgNameSuggestions: apiActionCreator(
    "FETCH_PERSORG_NAME_SUGGESTIONS",
    (searchText, suggestionsKey) => ({
      searchText,
      suggestionsKey,
    })
  ),
  cancelPersorgNameSuggestions: apiActionCreator(
    "CANCEL_PERSORG_NAME_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_PERSORG_NAME_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  createJustification: apiActionCreator(
    "CREATE_JUSTIFICATION",
    (justification) => ({ justification })
  ),
  deleteJustification: apiActionCreator(
    "DELETE_JUSTIFICATION",
    (justification) => ({ justification })
  ),

  fetchMainSearchResults: apiActionCreator(
    "FETCH_MAIN_SEARCH_RESULTS",
    (searchText) => ({ searchText })
  ),
  fetchPropositionsSearch: apiActionCreator(
    "FETCH_PROPOSITIONS_SEARCH",
    (searchText) => ({ searchText })
  ),

  fetchTag: apiActionCreator("FETCH_TAG", (tagId) => ({ tagId })),
  fetchTaggedPropositions: apiActionCreator(
    "FETCH_TAGGED_PROPOSITIONS",
    (tagId) => ({ tagId })
  ),
};
type UnknownApiActionCreator = ApiActionCreator<
  unknown,
  unknown,
  void | PrepareAction<unknown>
>;
export const apiActionCreatorsByActionType = reduce(
  api,
  (result: { [key: string]: UnknownApiActionCreator }, actionCreator) => {
    result[str(actionCreator)] = actionCreator as any;
    return result;
  },
  {}
);

/** "API-like": actions that indirectly result in API calls, such as actions that are translated into one or another
 * API call depending on some payload value or those that correspond to multiple API calls
 */
export const apiLike = {
  deleteJustificationRootTarget: createAction(
    "DELETE_JUSTIFICATION_ROOT_TARGET",
    (
      rootTargetType: JustificationRootTargetType,
      rootTarget: Persisted<JustificationRootTarget>
    ) => ({ rootTargetType, rootTarget })
  ),
  fetchJustificationTargets: createAction(
    "FETCH_JUSTIFICATION_TARGETS",
    (targetInfos: ContextTrailItemInfo[]) => ({ targetInfos })
  ),
};

/** UI actions */
export const ui = {
  unhandledAppClick: createAction("UI/UNHANDLED_APP_CLICK"),
  unhandledAppTouch: createAction("UI/UNHANDLED_APP_TOUCH"),
  showNavDrawer: createAction("SHOW_NAV_DRAWER"),
  hideNavDrawer: createAction("HIDE_NAV_DRAWER"),
  toggleNavDrawerVisibility: createAction("TOGGLE_NAV_DRAWER_VISIBILITY"),
  setNavDrawerVisibility: createAction("SET_NAV_DRAWER_VISIBILITY"),
  addToast: createAction("ADD_TOAST", (text: string) => ({ text })),
  dismissToast: createAction("DISMISS_TOAST"),

  mainSearchTextChange: createAction("MAIN_SEARCH_TEXT_CHANGE"),
  loginCredentialChange: createAction("LOGIN_CREDENTIAL_CHANGE"),
  clearJustificationsSearch: createAction("UI/CLEAR_JUSTIFICATIONS_SEARCH"),

  // TODO(92): remove transient actions, reducers, and sagas
  beginInteractionWithTransient: createAction(
    "UI/BEGIN_INTERACTION_WITH_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  endInteractionWithTransient: createAction(
    "UI/END_INTERACTION_WITH_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  showTransient: createAction("UI/SHOW_TRANSIENT", (transientId: unknown) => ({
    transientId,
  })),
  scheduleDelayedHideTransient: createAction(
    "UI/SCHEDULE_DELAYED_HIDE_TRANSIENT",
    (transientId: unknown, hideDelay: unknown) => ({ transientId, hideDelay })
  ),
  tryCancelDelayedHideTransient: createAction(
    "UI/TRY_CANCEL_DELAYED_HIDE_TRANSIENT",
    (transientId, cause) => ({ transientId, cause }),
  ),
  cancelDelayedHideTransient: createAction(
    "UI/CANCEL_DELAYED_HIDE_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  hideAllTransients: createAction("UI/HIDE_ALL_TRANSIENTS"),
  hideOtherTransients: createAction(
    "UI/HIDE_OTHER_TRANSIENTS",
    (visibleTransientId: unknown) => ({ visibleTransientId })
  ),
  hideTransient: createAction(
    "UI/HIDE_TRANSIENT",
    (transientId, cause) => ({ transientId, cause }),
  ),
  windowResize: createAction("UI/WINDOW_RESIZE"),
  setCanHover: createAction("UI/SET_CAN_HOVER", (canHover: boolean) => ({
    canHover,
  })),

  expand: createAction("UI/EXPAND", (widgetId: WidgetId) => ({ widgetId })),
  collapse: createAction("UI/COLLAPSE", (widgetId: WidgetId) => ({
    widgetId,
  })),

  enableMobileSite: createAction("UI/ENABLE_MOBILE_SITE"),
  disableMobileSite: createAction("UI/DISABLE_MOBILE_SITE"),

  clearTaggedPropositions: createAction("UI/CLEAR_TAGGED_PROPOSITIONS"),
};

export const pages = {
  // TODO(93): replace bespoke password reset page actions with an editor, if possible.
  beginPasswordResetRequest: createAction("PAGES/BEGIN_PASSWORD_RESET"),
  passwordResetRequestPropertyChange: createAction(
    "PAGES/PASSWORD_RESET_REQUEST_PROPERTY_CHANGE",
    (properties: PropertyChanges) => ({ properties })
  ),
  beginPasswordResetConfirmation: createAction(
    "PAGES/BEGIN_PASSWORD_RESET_CONFIRMATION"
  ),
  passwordResetConfirmationPropertyChange: createAction(
    "PAGES/PASSWORD_RESET_CONFIRMATION_PROPERTY_CHANGE",
    (properties: PropertyChanges) => ({ properties })
  ),
};

export const privacyConsent = {
  update: createAction(
    "PRIVACY_CONSENT/UPDATE",
    (cookies: PrivacyConsentCookie[]) => ({ cookies })
  ),
};

export type EditorActionCreator = ActionFunctionAny<Action<string>>;
export type EditorCommitActionCreator = EditorActionCreator & {
  result: ActionFunctionAny<Action<string>>;
};
const commitEdit = createAction(
  "EDITORS/COMMIT_EDIT",
  (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
) as ActionFunctionAny<Action<string>> as EditorCommitActionCreator;
commitEdit.result = createAction(
  "EDITORS/COMMIT_EDIT" + actionTypeDelim + "RESULT",
  (editorType: EditorType, editorId: EditorId, result) => ({
    editorType,
    editorId,
    result,
  })
);

export type ListPathFactory = string | ((payload: any) => string);

/** Editor actions */
export const editors = {
  beginEdit: createAction(
    "EDITORS/BEGIN_EDIT",
    (editorType: EditorType, editorId: EditorId, entity: EditorEntity) => ({
      editorType,
      editorId,
      entity,
    })
  ),
  propertyChange: createAction(
    "EDITORS/PROPERTY_CHANGE",
    (
      editorType: EditorType,
      editorId: EditorId,
      properties: { [key: string]: any }
    ) => ({ editorType, editorId, properties })
  ),
  commitEdit,
  cancelEdit: createAction(
    "EDITORS/CANCEL_EDIT",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),

  addListItem: createAction(
    "EDITORS/ON_ADD_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      itemIndex: number,
      listPathMaker: () => ListPathFactory,
      itemFactory: () => any
    ) => ({ editorType, editorId, itemIndex, listPathMaker, itemFactory }),
  ),
  removeListItem: createAction(
    "EDITORS/ON_REMOVE_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      itemIndex: number,
      listPathMaker: ListPathFactory
    ) => ({ editorType, editorId, itemIndex, listPathMaker })
  ),

  addSpeaker: createAction(
    "EDITORS/ADD_SPEAKER",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  removeSpeaker: createAction(
    "EDITORS/REMOVE_SPEAKER",
    (
      editorType: EditorType,
      editorId: EditorId,
      speaker: Persorg,
      index: number
    ) => ({
      editorType,
      editorId,
      speaker,
      index,
    })
  ),
  replaceSpeaker: createAction(
    "EDITORS/REPLACE_SPEAKER",
    (
      editorType: EditorType,
      editorId: EditorId,
      speaker: Persorg,
      index: number
    ) => ({
      editorType,
      editorId,
      speaker,
      index,
    })
  ),

  addUrl: createAction(
    "EDITORS/ADD_URL",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  removeUrl: createAction(
    "EDITORS/REMOVE_URL",
    (editorType: EditorType, editorId: EditorId, url: Url, index: number) => ({
      editorType,
      editorId,
      url,
      index,
    })
  ),

  addPropositionCompoundAtom: createAction(
    "EDITORS/ADD_PROPOSITION_COMPOUND_ATOM",
    (editorType: EditorType, editorId: EditorId, index: number) => ({
      editorType,
      editorId,
      index,
    })
  ),
  removePropositionCompoundAtom: createAction(
    "EDITORS/REMOVE_PROPOSITION_COMPOUND_ATOM",
    (
      editorType: EditorType,
      editorId: EditorId,
      atom: PropositionCompoundAtom,
      index: number
    ) => ({
      editorType,
      editorId,
      atom,
      index,
    })
  ),

  tagProposition: createAction(
    "EDITORS/TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),
  unTagProposition: createAction(
    "EDITORS/UN_TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),
  antiTagProposition: createAction(
    "EDITORS/ANTI_TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),

  resetSubmission: createAction(
    "EDITORS/RESET_SUBMISSION",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
};

/** Actions that change the current page */
export const goto = {
  login: createAction(
    "GOTO/LOGIN",
    (loginRedirectLocation: Location<unknown>) => ({ loginRedirectLocation })
  ),
  proposition: createAction("GOTO/PROPOSITION", (proposition: Proposition) => ({
    proposition,
  })),
  statement: createAction("GOTO/STATEMENT", (statement: Statement) => ({
    statement,
  })),
  justification: createAction(
    "GOTO/JUSTIFICATION",
    (justification: Justification) => ({ justification })
  ),
  mainSearch: createAction("GOTO/MAIN_SEARCH", (mainSearchText: string) => ({
    mainSearchText,
  })),
  tag: createAction("GOTO/TAG", (tag: Tag) => ({ tag })),
  createJustification: createAction("GOTO/CREATE_JUSTIFICATION"),
  writQuote: createAction("GOTO/WRIT_QUOTE", (writQuote: WritQuote) => ({
    writQuote,
  })),
};

/** Actions that represent multi-step flows */
export const flows = {
  fetchAndBeginEditOfNewJustificationFromBasisSource: createAction(
    "FLOWS/FETCH_AND_BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_BASIS_SOURCE",
    (
      editorType: EditorType,
      editorId: EditorId,
      basisSourceType: JustificationBasisSourceType,
      basisSourceId: EntityId
    ) => ({ editorType, editorId, basisSourceType, basisSourceId })
  ),
  beginEditOfNewJustificationFromTarget: createAction(
    "FLOWS/BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_TARGET",
    (content: ExtensionAnnotationContent, source: Source, target: Target) => ({
      content,
      source,
      target,
    })
  ),
  commitEditThenView: createAction(
    "FLOWS/COMMIT_PROPOSITION_THEN_VIEW",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  commitEditThenPutActionOnSuccess: createAction(
    "FLOWS/COMMIT_EDIT_THEN_PUT_ACTION_ON_SUCCESS",
    (editorType: EditorType, editorId: EditorId, onSuccessAction: Action) => ({
      editorType,
      editorId,
      onSuccessAction,
    })
  ),
};

export const autocompletes = {
  clearSuggestions: createAction(
    "AUTOCOMPLETES/CLEAR_SUGGESTIONS",
    (suggestionsKey: SuggestionsKey) => ({ suggestionsKey })
  ),
};

export const errors = {
  clearLoggedErrors: createAction("ERRORS/CLEAR_LOGGED_ERRORS"),
};
