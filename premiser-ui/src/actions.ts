import { ActionFunctionAny } from "redux-actions";
import { Location, LocationState } from "history";
import { Action } from "redux";

import {
  EntityId,
  WritQuote,
  JustificationRootTargetType,
  Proposition,
  Persorg,
  Url,
  PropositionCompoundAtom,
  Tag,
  Statement,
  Justification,
  JustificationBasisSourceType,
} from "howdju-common";
import {
  Source,
  Target,
  ExtensionAnnotationContent,
  JustificationRootTargetViewModel,
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

export { str } from "./actionHelpers";

export const app = {
  clearAuthToken: createAction("APP/CLEAR_AUTH_TOKEN"),
  checkAuthExpiration: createAction("APP/CHECK_AUTH_EXPIRATION"),
};

export {
  mapActionCreatorGroupToDispatchToProps,
  combineActions,
} from "./actionHelpers";

export { api } from "./apiActions";

/** "API-like": actions that indirectly result in API calls, such as actions that are translated into one or another
 * API call depending on some payload value or those that correspond to multiple API calls
 */
export const apiLike = {
  deleteJustificationRootTarget: createAction(
    "DELETE_JUSTIFICATION_ROOT_TARGET",
    (
      rootTargetType: JustificationRootTargetType,
      rootTarget: JustificationRootTargetViewModel
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
    (transientId, cause) => ({ transientId, cause })
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
  hideTransient: createAction("UI/HIDE_TRANSIENT", (transientId, cause) => ({
    transientId,
    cause,
  })),
  windowResize: createAction("UI/WINDOW_RESIZE"),

  expand: createAction("UI/EXPAND", (widgetId: WidgetId) => ({ widgetId })),
  collapse: createAction("UI/COLLAPSE", (widgetId: WidgetId) => ({
    widgetId,
  })),

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
  blurField: createAction(
    "EDITORS/BLUR_FIELD",
    (editorType: EditorType, editorId: EditorId, fieldName: string) => ({
      editorType,
      editorId,
      fieldName,
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
      listPathMaker: ListPathFactory,
      itemFactory: () => any
    ) => ({ editorType, editorId, itemIndex, listPathMaker, itemFactory })
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
    (loginRedirectLocation: Location<LocationState>) => ({
      loginRedirectLocation,
    })
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
  logError: createAction("ERRORS/LOG_ERROR", ({ error }: { error: Error }) => ({
    error,
  })),
  clearLoggedErrors: createAction("ERRORS/CLEAR_LOGGED_ERRORS"),
};
