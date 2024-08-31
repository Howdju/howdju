import { ActionFunctionAny } from "redux-actions";
import { Location, LocationState } from "history";
import { Action } from "redux";
import { ActionCreatorWithPreparedPayload } from "@reduxjs/toolkit";

import {
  MediaExcerptInfo,
  EntityId,
  JustificationRootTargetType,
  Url,
  PropositionCompoundAtom,
  Tag,
  JustificationBasisSourceType,
  PersistedJustificationWithRootRef,
  MediaExcerptOut,
  CreatePersorgInput,
  PropositionOut,
  StatementOut,
  WritQuoteOut,
  TagOut,
} from "howdju-common";

import { EditorEntity, EditorType } from "./reducers/editors";
import {
  PrivacyConsentCookie,
  PropertyChanges,
  SuggestionsKey,
  EditorId,
} from "./types";
import { createAction, actionTypeDelim } from "./actionHelpers";
import { AnyAction } from "@reduxjs/toolkit";
import { AnyApiAction } from "./apiActions";
import { ViewableEditorType } from "./sagas/editors/commitEditorThenViewSaga";

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
    (rootTargetType: JustificationRootTargetType, rootTargetId: EntityId) => ({
      rootTargetType,
      rootTargetId,
    })
  ),
};

/** UI actions */
export const ui = {
  unhandledAppClick: createAction("UI/UNHANDLED_APP_CLICK"),
  unhandledAppTouch: createAction("UI/UNHANDLED_APP_TOUCH"),

  loginCredentialChange: createAction("LOGIN_CREDENTIAL_CHANGE"),
  clearJustificationsSearch: createAction("UI/CLEAR_JUSTIFICATIONS_SEARCH"),

  windowResize: createAction("UI/WINDOW_RESIZE"),

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

export type EditorActionCreator = ActionCreatorWithPreparedPayload<
  any[],
  {
    editorType: EditorType;
    editorId: EditorId;
  }
>;
export type EditorCommitActionCreator = EditorActionCreator & {
  result: ActionCreatorWithPreparedPayload<
    any[],
    {
      editorType: EditorType;
      editorId: EditorId;
      result: any;
    },
    string,
    boolean
  >;
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

export type ListPathFactory =
  | string
  | string[]
  | ((payload: any) => string)
  | ((payload: any) => string[]);

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
  attemptedSubmit: createAction(
    "EDITORS/ATTEMPTED_SUBMIT",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  commitEdit,
  cancelEdit: createAction(
    "EDITORS/CANCEL_EDIT",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),

  addListItem: createAction(
    "EDITORS/ADD_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      listPathMaker: ListPathFactory,
      itemIndex: number,
      itemFactory: () => any
    ) => ({ editorType, editorId, itemIndex, listPathMaker, itemFactory })
  ),
  removeListItem: createAction(
    "EDITORS/REMOVE_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      listPathMaker: ListPathFactory,
      itemIndex: number
    ) => ({ editorType, editorId, itemIndex, listPathMaker })
  ),
  replaceListItem: createAction(
    "EDITORS/REPLACE_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      listPathMaker: ListPathFactory,
      itemIndex: number,
      item: any
    ) => ({ editorType, editorId, itemIndex, listPathMaker, item })
  ),
  /** @deprecated TODO(523) replace with editors.addListItem */
  addSpeaker: createAction(
    "EDITORS/ADD_SPEAKER",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  /** @deprecated TODO(523) replace with editors.remoteListItem */
  removeSpeaker: createAction(
    "EDITORS/REMOVE_SPEAKER",
    (
      editorType: EditorType,
      editorId: EditorId,
      speaker: CreatePersorgInput,
      index: number
    ) => ({
      editorType,
      editorId,
      speaker,
      index,
    })
  ),

  /** @deprecated TODO(523) use addListItem instead */
  addUrl: createAction(
    "EDITORS/ADD_URL",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  /** @deprecated TODO(523) use removeListItem instead */
  removeUrl: createAction(
    "EDITORS/REMOVE_URL",
    (editorType: EditorType, editorId: EditorId, url: Url, index: number) => ({
      editorType,
      editorId,
      url,
      index,
    })
  ),

  /** @deprecated TODO(523) use addListItem instead */
  addPropositionCompoundAtom: createAction(
    "EDITORS/ADD_PROPOSITION_COMPOUND_ATOM",
    (editorType: EditorType, editorId: EditorId, index: number) => ({
      editorType,
      editorId,
      index,
    })
  ),
  /** @deprecated TODO(523) use removeListItem instead */
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

  inferMediaExcerptInfo: createAction(
    "EDITORS/INFER_MEDIA_EXCERPT_INFO",
    (
      editorType: EditorType,
      editorId: EditorId,
      url: string,
      index: number,
      quotation?: string
    ) => ({
      editorType,
      editorId,
      url,
      index,
      quotation,
    })
  ),
  inferMediaExcerptInfoSucceeded: createAction(
    "EDITORS/INFER_MEDIA_EXCERPT_INFO/SUCCEEDED",
    (
      editorType: EditorType,
      editorId: EditorId,
      index: number,
      mediaExcerptInfo: MediaExcerptInfo
    ) => ({
      editorType,
      editorId,
      index,
      mediaExcerptInfo,
    })
  ),
  inferMediaExcerptInfoFailed: createAction(
    "EDITORS/INFER_MEDIA_EXCERPT_INFO/FAILED",
    (
      editorType: EditorType,
      editorId: EditorId,
      index: number,
      error: Error
    ) => ({
      editorType,
      editorId,
      index,
      error,
    })
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
  proposition: createAction(
    "GOTO/PROPOSITION",
    (proposition: PropositionOut) => ({
      proposition,
    })
  ),
  statement: createAction("GOTO/STATEMENT", (statement: StatementOut) => ({
    statement,
  })),
  justification: createAction(
    "GOTO/JUSTIFICATION",
    (justification: PersistedJustificationWithRootRef) => ({
      justification,
    })
  ),
  mainSearch: createAction("GOTO/MAIN_SEARCH", (mainSearchText: string) => ({
    mainSearchText,
  })),
  tag: createAction("GOTO/TAG", (tag: TagOut) => ({ tag })),
  writQuote: createAction("GOTO/WRIT_QUOTE", (writQuote: WritQuoteOut) => ({
    writQuote,
  })),
  newMediaExcerpt: createAction("GOTO/NEW_MEDIA_EXCERPT"),
  mediaExcerpt: createAction(
    "GOTO/MEDIA_EXCERPT",
    (mediaExcerpt: MediaExcerptOut) => ({ mediaExcerpt })
  ),
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
  beginEditOfMediaExcerptFromInfo: createAction(
    "FLOWS/SUBMIT_MEDIA_EXCERPT_FROM_ANCHOR_INFO",
    (anchorInfo: MediaExcerptInfo) => anchorInfo
  ),
  commitEditThenView: createAction(
    "FLOWS/COMMIT_PROPOSITION_THEN_VIEW",
    (editorType: ViewableEditorType, editorId: EditorId) => ({
      editorType,
      editorId,
    })
  ),
  commitEditThenPutActionOnSuccess: createAction(
    "FLOWS/COMMIT_EDIT_THEN_PUT_ACTION_ON_SUCCESS",
    (editorType: EditorType, editorId: EditorId, onSuccessAction: Action) => ({
      editorType,
      editorId,
      onSuccessAction,
    })
  ),
  apiActionOnSuccess: createAction(
    "FLOWS/API_ACTION_ON_SUCCESS",
    (
      apiAction: AnyApiAction,
      ...onSuccessActions: [AnyAction, ...AnyAction[]]
    ) => ({
      apiAction,
      onSuccessActions,
    })
  ),
};

export const autocompletes = {
  clearSuggestions: createAction(
    "AUTOCOMPLETES/CLEAR_SUGGESTIONS",
    (suggestionsKey: SuggestionsKey) => ({ suggestionsKey })
  ),
};
