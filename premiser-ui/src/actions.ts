import {
  ActionFunctionAny,
  createAction as actionCreator,
  Action as PayloadAction,
  combineActions as untypedCombineActions,
  ActionMeta,
} from "redux-actions";
import reduce from "lodash/reduce";
import mapValues from "lodash/mapValues";
import assign from "lodash/assign";
import { ActionCreator, ActionCreatorsMapObject } from "@reduxjs/toolkit";
import { Location } from "history";
import { Action, bindActionCreators } from "redux";

import {
  EntityId,
  JustificationVotePolarities,
  PropositionTagVotePolarities,
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
  PropositionTagVote,
  makePropositionTagVoteSubmission,
} from "howdju-common";
import { actions, Source, Target, ExtensionAnnotationContent } from "howdju-client-common";

import { EditorEntity, EditorType } from "./reducers/editors";
import { AppDispatch } from "./store";
import {
  ContextTrailItemInfo,
  PrivacyConsentCookie,
  PropertyChanges,
  SuggestionsKey,
  WidgetId,
  EditorId,
} from "./types";

const actionTypeDelim = "/";

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = actions.str;

export interface TypedActionCreatorsMapObject<A = any> {
  [key: string]: ActionCreator<PayloadAction<A>>
}

// redux-action's combineActions return value is recognized as a valid object key.
// So provide this typed version instead.
export const combineActions = untypedCombineActions as (...actionTypes: Array<ActionFunctionAny<Action<string>> | string | symbol>) => any

/**
 * Helper to bind action creator groups to dispatch for redux-react's connect method.
 *
 * Action groups are what we call the objects below with react-actions action creators.  They are just
 * a way to organize related action creators.  The convention with redux-react's connect method's mapDispatchToProps
 * is to pass an object with keys equal to action creators.  redux-react will automatically turn the action creators
 * into dispatched versions.  This helper accomplishes the same for an object the properties of which are action creator
 * groups like those defined below.
 *
 * @param actionCreatorGroups a map of action creator groups that will be bound by the name of the
 *   action creator group on the returned value.
 * @param otherActions a map of ActionCreators that will be bound to dispatch directly on the
 *   returned value.
 */
export const mapActionCreatorGroupToDispatchToProps =
  <M extends object, N>(actionCreatorGroups: M, otherActions?: N) =>
    (dispatch: AppDispatch): M & N => {
      const dispatchingProps = mapValues(
        actionCreatorGroups, (actionCreatorGroup: ActionCreatorsMapObject<any>) =>
          bindActionCreators(actionCreatorGroup, dispatch)
        ) as { [P in keyof M]: M[P]; } & { [P in keyof N]: N[P]; };

      if (otherActions) {
        assign(
          dispatchingProps,
          bindActionCreators(otherActions, dispatch)
        );
      }

      return dispatchingProps;
    };

type ActionType = string
// ActionFunction: something that creates ActionCreators.
// ActionCreator: a factory for actions.
type ApiActionFunction = ActionFunctionAny<Action<ActionType>> & {
  response: ActionFunctionAny<Action<ActionType>>;
};

const apiActionType = (actionType: string) =>
  "API" + actionTypeDelim + actionType;

export type ApiActionMeta = {
  normalizationSchema: any,
  requestPayload: any,
}
export type ApiAction<T = {}> = ActionMeta<T, ApiActionMeta>

/** Create an action creator having a property `.response` with another action creator for corresponding API responses */
function apiActionCreator<P, M>(
  actionType: string,
  payloadCreator?: ActionFunctionAny<P>,
  metaCreator?: ActionFunctionAny<M>
) {
  const fullActionType = apiActionType(actionType);
  const ac = payloadCreator
    ? metaCreator
      ? (actionCreator(
          fullActionType,
          payloadCreator,
          metaCreator
        ) as unknown as ApiActionFunction)
      : (actionCreator(fullActionType, payloadCreator) as unknown as ApiActionFunction)
    : (actionCreator(fullActionType) as unknown as ApiActionFunction);
  ac.response = actionCreator(
    fullActionType + actionTypeDelim + "RESPONSE",
    (payload, _meta) => payload,
    (_payload, meta) => meta
  );
  return ac;
}

export const app = {
  searchMainSearch: actionCreator(
    "APP/SEARCH_MAIN_SEARCH",
    (searchText: string) => ({ searchText })
  ),
  clearAuthToken: actionCreator("APP/CLEAR_AUTH_TOKEN"),
  checkAuthExpiration: actionCreator("APP/CHECK_AUTH_EXPIRATION"),
};

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
    (rootTargetType: JustificationRootTargetType, rootTargetId: EntityId) => ({
      rootTargetType,
      rootTargetId,
    })
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
    (propositionId: EntityId, tag: Tag, propositionTagVote: PropositionTagVote) => ({
      propositionTagVote: makePropositionTagVoteSubmission({
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
      propositionTagVote: makePropositionTagVoteSubmission({
        polarity: PropositionTagVotePolarities.NEGATIVE,
        proposition: { id: propositionId },
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    })
  ),
  unTagProposition: apiActionCreator(
    "UN_TAG_PROPOSITION",
    (propositionTagVote: Persisted<PropositionTagVote>) => ({ prevPropositionTagVote: propositionTagVote })
  ),

  createProposition: apiActionCreator("CREATE_PROPOSITION", (proposition) => ({
    proposition,
  })),
  updateProposition: apiActionCreator(
    "UPDATE_PROPOSITION",
    (proposition: Proposition) => ({ proposition }),
    (_p: Proposition, nonce) => ({ nonce })
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
      cancelTarget: apiActionType("FETCH_PROPOSITION_TEXT_SUGGESTIONS"),
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
      cancelTarget: apiActionType("FETCH_WRIT_TITLE_SUGGESTIONS"),
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
      cancelTarget: apiActionType("FETCH_TAG_NAME_SUGGESTIONS"),
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
      cancelTarget: apiActionType("FETCH_MAIN_SEARCH_SUGGESTIONS"),
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
      cancelTarget: apiActionType("FETCH_PERSORG_NAME_SUGGESTIONS"),
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
export const apiActionCreatorsByActionType = reduce(
  api,
  (result: { [key: string]: ApiActionFunction }, actionCreator) => {
    result[str(actionCreator)] = actionCreator;
    return result;
  },
  {}
);

/** "API-like": actions that indirectly result in API calls, such as actions that are translated into one or another
 * API call depending on some payload value or those that correspond to multiple API calls
 */
export const apiLike = {
  deleteJustificationRootTarget: actionCreator(
    "DELETE_JUSTIFICATION_ROOT_TARGET",
    (
      rootTargetType: JustificationRootTargetType,
      rootTarget: Persisted<JustificationRootTarget>
    ) => ({ rootTargetType, rootTarget })
  ),
  fetchJustificationTargets: actionCreator(
    "FETCH_JUSTIFICATION_TARGETS",
    (targetInfos: ContextTrailItemInfo[]) => ({ targetInfos })
  ),
};

/** UI actions */
export const ui = {
  unhandledAppClick: actionCreator("UI/UNHANDLED_APP_CLICK"),
  unhandledAppTouch: actionCreator("UI/UNHANDLED_APP_TOUCH"),
  showNavDrawer: actionCreator("SHOW_NAV_DRAWER"),
  hideNavDrawer: actionCreator("HIDE_NAV_DRAWER"),
  toggleNavDrawerVisibility: actionCreator("TOGGLE_NAV_DRAWER_VISIBILITY"),
  setNavDrawerVisibility: actionCreator("SET_NAV_DRAWER_VISIBILITY"),
  addToast: actionCreator("ADD_TOAST", (text: string) => ({ text })),
  dismissToast: actionCreator("DISMISS_TOAST"),

  mainSearchTextChange: actionCreator("MAIN_SEARCH_TEXT_CHANGE"),
  loginCredentialChange: actionCreator("LOGIN_CREDENTIAL_CHANGE"),
  clearJustificationsSearch: actionCreator("UI/CLEAR_JUSTIFICATIONS_SEARCH"),

  // TODO(92): remove transient actions, reducers, and sagas
  beginInteractionWithTransient: actionCreator(
    "UI/BEGIN_INTERACTION_WITH_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  endInteractionWithTransient: actionCreator(
    "UI/END_INTERACTION_WITH_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  showTransient: actionCreator("UI/SHOW_TRANSIENT", (transientId: unknown) => ({
    transientId,
  })),
  scheduleDelayedHideTransient: actionCreator(
    "UI/SCHEDULE_DELAYED_HIDE_TRANSIENT",
    (transientId: unknown, hideDelay: unknown) => ({ transientId, hideDelay })
  ),
  tryCancelDelayedHideTransient: actionCreator(
    "UI/TRY_CANCEL_DELAYED_HIDE_TRANSIENT",
    (transientId, _cause) => ({ transientId }),
    (_transientId, cause) => ({ cause })
  ),
  cancelDelayedHideTransient: actionCreator(
    "UI/CANCEL_DELAYED_HIDE_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  hideAllTransients: actionCreator("UI/HIDE_ALL_TRANSIENTS"),
  hideOtherTransients: actionCreator(
    "UI/HIDE_OTHER_TRANSIENTS",
    (visibleTransientId: unknown) => ({ visibleTransientId })
  ),
  hideTransient: actionCreator(
    "UI/HIDE_TRANSIENT",
    (transientId, _cause) => ({ transientId }),
    (_transientId, cause) => ({ cause })
  ),
  windowResize: actionCreator("UI/WINDOW_RESIZE"),
  setCanHover: actionCreator("UI/SET_CAN_HOVER", (canHover: boolean) => ({
    canHover,
  })),

  expand: actionCreator("UI/EXPAND", (widgetId: WidgetId) => ({ widgetId })),
  collapse: actionCreator("UI/COLLAPSE", (widgetId: WidgetId) => ({
    widgetId,
  })),

  enableMobileSite: actionCreator("UI/ENABLE_MOBILE_SITE"),
  disableMobileSite: actionCreator("UI/DISABLE_MOBILE_SITE"),

  clearTaggedPropositions: actionCreator("UI/CLEAR_TAGGED_PROPOSITIONS"),
};

export const pages = {
  // TODO(93): replace bespoke password reset page actions with an editor, if possible.
  beginPasswordResetRequest: actionCreator("PAGES/BEGIN_PASSWORD_RESET"),
  passwordResetRequestPropertyChange: actionCreator(
    "PAGES/PASSWORD_RESET_REQUEST_PROPERTY_CHANGE",
    (properties: PropertyChanges) => ({ properties })
  ),
  beginPasswordResetConfirmation: actionCreator(
    "PAGES/BEGIN_PASSWORD_RESET_CONFIRMATION"
  ),
  passwordResetConfirmationPropertyChange: actionCreator(
    "PAGES/PASSWORD_RESET_CONFIRMATION_PROPERTY_CHANGE",
    (properties: PropertyChanges) => ({ properties })
  ),
};

export const privacyConsent = {
  update: actionCreator(
    "PRIVACY_CONSENT/UPDATE",
    (cookies: PrivacyConsentCookie[]) => ({ cookies })
  ),
};

export type EditorActionCreator = ActionFunctionAny<Action<string>>;
export type EditorCommitActionCreator = EditorActionCreator & {
  result: ActionFunctionAny<Action<string>>;
};
const commitEdit = actionCreator(
  "EDITORS/COMMIT_EDIT",
  (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
) as ActionFunctionAny<Action<string>> as EditorCommitActionCreator;
commitEdit.result = actionCreator(
  "EDITORS/COMMIT_EDIT" + actionTypeDelim + "RESULT",
  (editorType: EditorType, editorId: EditorId, result) => ({
    editorType,
    editorId,
    result,
  }),
  (...args) => {
    if (args.length === 4) {
      return args[3];
    } else if (args.length === 2 && args[0] instanceof Error) {
      return args[1];
    }
    return undefined;
  }
);

export type ListPathFactory = string | ((payload: any) => string);

/** Editor actions */
export const editors = {
  beginEdit: actionCreator(
    "EDITORS/BEGIN_EDIT",
    (editorType: EditorType, editorId: EditorId, entity: EditorEntity) => ({
      editorType,
      editorId,
      entity,
    })
  ),
  propertyChange: actionCreator(
    "EDITORS/PROPERTY_CHANGE",
    (
      editorType: EditorType,
      editorId: EditorId,
      properties: { [key: string]: any }
    ) => ({ editorType, editorId, properties })
  ),
  commitEdit,
  cancelEdit: actionCreator(
    "EDITORS/CANCEL_EDIT",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),

  addListItem: actionCreator(
    "EDITORS/ON_ADD_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      itemIndex: number,
      listPathMaker: () => ListPathFactory,
      itemFactory: () => any
    ) => ({ editorType, editorId, itemIndex, listPathMaker, itemFactory }),
    // The actionCreator overload ActionCreatorAny requires a meta creator,
    // so we provide a no-op one.
    () => null
  ),
  removeListItem: actionCreator(
    "EDITORS/ON_REMOVE_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      itemIndex: number,
      listPathMaker: ListPathFactory
    ) => ({ editorType, editorId, itemIndex, listPathMaker })
  ),

  addSpeaker: actionCreator(
    "EDITORS/ADD_SPEAKER",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  removeSpeaker: actionCreator(
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
  replaceSpeaker: actionCreator(
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

  addUrl: actionCreator(
    "EDITORS/ADD_URL",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  removeUrl: actionCreator(
    "EDITORS/REMOVE_URL",
    (editorType: EditorType, editorId: EditorId, url: Url, index: number) => ({
      editorType,
      editorId,
      url,
      index,
    })
  ),

  addPropositionCompoundAtom: actionCreator(
    "EDITORS/ADD_PROPOSITION_COMPOUND_ATOM",
    (editorType: EditorType, editorId: EditorId, index: number) => ({
      editorType,
      editorId,
      index,
    })
  ),
  removePropositionCompoundAtom: actionCreator(
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

  tagProposition: actionCreator(
    "EDITORS/TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),
  unTagProposition: actionCreator(
    "EDITORS/UN_TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),
  antiTagProposition: actionCreator(
    "EDITORS/ANTI_TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),

  resetSubmission: actionCreator(
    "EDITORS/RESET_SUBMISSION",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
};

/** Actions that change the current page */
export const goto = {
  login: actionCreator(
    "GOTO/LOGIN",
    (loginRedirectLocation: Location<unknown>) => ({ loginRedirectLocation })
  ),
  proposition: actionCreator(
    "GOTO/PROPOSITION",
    (proposition: Proposition) => ({ proposition })
  ),
  statement: actionCreator("GOTO/STATEMENT", (statement: Statement) => ({
    statement,
  })),
  justification: actionCreator(
    "GOTO/JUSTIFICATION",
    (justification: Justification) => ({ justification })
  ),
  mainSearch: actionCreator("GOTO/MAIN_SEARCH", (mainSearchText: string) => ({
    mainSearchText,
  })),
  tag: actionCreator("GOTO/TAG", (tag: Tag) => ({ tag })),
  createJustification: actionCreator("GOTO/CREATE_JUSTIFICATION"),
  writQuote: actionCreator("GOTO/WRIT_QUOTE", (writQuote: WritQuote) => ({
    writQuote,
  })),
};

/** Actions that represent multi-step flows */
export const flows = {
  fetchAndBeginEditOfNewJustificationFromBasisSource: actionCreator(
    "FLOWS/FETCH_AND_BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_BASIS_SOURCE",
    (
      editorType: EditorType,
      editorId: EditorId,
      basisSourceType: JustificationBasisSourceType,
      basisSourceId: EntityId
    ) => ({ editorType, editorId, basisSourceType, basisSourceId })
  ),
  beginEditOfNewJustificationFromTarget: actionCreator(
    "FLOWS/BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_TARGET",
    (content: ExtensionAnnotationContent, source: Source, target: Target) => ({
      content,
      source,
      target,
    })
  ),
  commitEditThenView: actionCreator(
    "FLOWS/COMMIT_PROPOSITION_THEN_VIEW",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  commitEditThenPutActionOnSuccess: actionCreator(
    "FLOWS/COMMIT_EDIT_THEN_PUT_ACTION_ON_SUCCESS",
    (editorType: EditorType, editorId: EditorId, onSuccessAction: Action) => ({
      editorType,
      editorId,
      onSuccessAction,
    })
  ),
};

export const autocompletes = {
  clearSuggestions: actionCreator(
    "AUTOCOMPLETES/CLEAR_SUGGESTIONS",
    (suggestionsKey: SuggestionsKey) => ({ suggestionsKey })
  ),
};

export const errors = {
  clearLoggedErrors: actionCreator("ERRORS/CLEAR_LOGGED_ERRORS"),
};
